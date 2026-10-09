package repository

import (
	"context"
	"errors"
	"payment-gateway/webhook-service/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WebhookRepositoryImpl struct {
	db *gorm.DB
}

func NewWebhookRepository(db *gorm.DB) domain.WebhookRepository {
	return &WebhookRepositoryImpl{db: db}
}

func (r *WebhookRepositoryImpl) IdempotentInsertDelivery(ctx context.Context, delivery *domain.Delivery) (bool, error) {
	err := r.db.WithContext(ctx).Create(delivery).Error
	if err != nil {
		var pgErr *pgconn.PgError
		isUniqueErr := false

		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			isUniqueErr = true
		}
		if strings.Contains(err.Error(), "UNIQUE constraint failed") || strings.Contains(err.Error(), "duplicate key value") {
			isUniqueErr = true
		}

		if isUniqueErr {
			return false, nil // Idempotency hit, event already exists
		}
		return false, err
	}
	return true, nil
}

func (r *WebhookRepositoryImpl) ClaimDeliveries(ctx context.Context, workerID string, limit int) ([]domain.Delivery, error) {
	var deliveries []domain.Delivery

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// PostgreSQL locking: FOR UPDATE SKIP LOCKED
		// We only fetch PENDING or RETRY_WAIT where NextRetryAt <= NOW()
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("status IN ? AND (next_retry_at IS NULL OR next_retry_at <= ?)", []domain.WebhookState{domain.StatePending, domain.StateRetryWait}, time.Now()).
			Limit(limit).
			Find(&deliveries).Error; err != nil {
			return err
		}

		if len(deliveries) == 0 {
			return nil
		}

		// Mark them as DELIVERING
		now := time.Now()
		var ids []string
		for _, d := range deliveries {
			ids = append(ids, d.ID.String())
		}

		if err := tx.Model(&domain.Delivery{}).Where("id IN ?", ids).Updates(map[string]interface{}{
			"status":    domain.StateDelivering,
			"locked_at": now,
			"locked_by": workerID,
		}).Error; err != nil {
			return err
		}

		// Mutate the local copies to reflect the new state for the caller
		for i := range deliveries {
			deliveries[i].Status = domain.StateDelivering
			deliveries[i].LockedAt = &now
			deliveries[i].LockedBy = &workerID
		}

		return nil
	})

	return deliveries, err
}

func (r *WebhookRepositoryImpl) SaveAttempt(ctx context.Context, delivery *domain.Delivery, attempt *domain.Attempt) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(attempt).Error; err != nil {
			return err
		}
		
		if err := tx.Save(delivery).Error; err != nil {
			return err
		}
		
		return nil
	})
}

func (r *WebhookRepositoryImpl) UnlockStaleDeliveries(ctx context.Context, timeoutMinutes int) (int64, error) {
	staleThreshold := time.Now().Add(-time.Duration(timeoutMinutes) * time.Minute)
	
	result := r.db.WithContext(ctx).Model(&domain.Delivery{}).
		Where("status = ? AND locked_at < ?", domain.StateDelivering, staleThreshold).
		Updates(map[string]interface{}{
			"status":    domain.StateRetryWait,
			"locked_at": nil,
			"locked_by": nil,
		})

	return result.RowsAffected, result.Error
}

func (r *WebhookRepositoryImpl) GetDeliveriesByMerchantID(ctx context.Context, merchantID uuid.UUID, limit int, offset int) ([]domain.Delivery, error) {
	var deliveries []domain.Delivery
	err := r.db.WithContext(ctx).
		Where("merchant_id = ?", merchantID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&deliveries).Error
	return deliveries, err
}

func (r *WebhookRepositoryImpl) CountDeliveriesByMerchantID(ctx context.Context, merchantID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Delivery{}).Where("merchant_id = ?", merchantID).Count(&count).Error
	return count, err
}

func (r *WebhookRepositoryImpl) ReplayDelivery(ctx context.Context, deliveryID uuid.UUID, merchantID uuid.UUID) error {
	now := time.Now()
	result := r.db.WithContext(ctx).Model(&domain.Delivery{}).
		Where("id = ? AND merchant_id = ?", deliveryID, merchantID).
		Updates(map[string]interface{}{
			"status":        domain.StatePending,
			"next_retry_at": now,
			"attempt_count": 0,
			"locked_at":     nil,
			"locked_by":     nil,
			"last_error":    nil,
		})
	
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("delivery not found or unauthorized")
	}
	return nil
}

package repository

import (
	"context"
	"errors"
	"payment-gateway/settlement-service/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PayoutRepositoryImpl struct {
	db *gorm.DB
}

func NewPayoutRepository(db *gorm.DB) domain.PayoutRepository {
	return &PayoutRepositoryImpl{db: db}
}

func (r *PayoutRepositoryImpl) CreatePayout(ctx context.Context, payout *domain.Payout) error {
	return r.db.WithContext(ctx).Create(payout).Error
}

func (r *PayoutRepositoryImpl) GetPayoutByID(ctx context.Context, id uuid.UUID) (*domain.Payout, error) {
	var p domain.Payout
	if err := r.db.WithContext(ctx).First(&p, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil if not found
		}
		return nil, err
	}
	return &p, nil
}

func (r *PayoutRepositoryImpl) GetPayoutByIdempotencyKey(ctx context.Context, merchantID uuid.UUID, idempotencyKey string) (*domain.Payout, error) {
	var p domain.Payout
	if err := r.db.WithContext(ctx).First(&p, "merchant_id = ? AND idempotency_key = ?", merchantID, idempotencyKey).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *PayoutRepositoryImpl) UpdatePayoutState(ctx context.Context, id uuid.UUID, expectedState domain.PayoutState, newState domain.PayoutState, providerRef *string) error {
	updates := map[string]interface{}{
		"status": newState,
	}
	if providerRef != nil {
		updates["provider_reference"] = *providerRef
	}

	result := r.db.WithContext(ctx).Model(&domain.Payout{}).
		Where("id = ? AND status = ?", id, expectedState).
		Updates(updates)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("optimistic lock failure or payout not found")
	}
	return nil
}

func (r *PayoutRepositoryImpl) GetPayoutsPaginated(ctx context.Context, merchantID uuid.UUID, limit int, offset int) ([]*domain.Payout, error) {
	var payouts []*domain.Payout
	err := r.db.WithContext(ctx).
		Where("merchant_id = ?", merchantID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&payouts).Error
	return payouts, err
}

func (r *PayoutRepositoryImpl) CountPayouts(ctx context.Context, merchantID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Payout{}).Where("merchant_id = ?", merchantID).Count(&count).Error
	return count, err
}

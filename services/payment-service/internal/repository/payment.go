package repository

import (
	"context"
	"errors"
	"strings"
	"payment-gateway/payment-service/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

type PaymentRepositoryImpl struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) domain.PaymentRepository {
	return &PaymentRepositoryImpl{db: db}
}

func (r *PaymentRepositoryImpl) CreatePaymentWithIdempotency(ctx context.Context, p *domain.Payment, history *domain.PaymentStateHistory, idem *domain.IdempotencyKey, payloadHash string) (*domain.Payment, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Attempt to insert Idempotency Key
		idem.PayloadHash = payloadHash
		tx.SavePoint("before_idem")
		if err := tx.Create(idem).Error; err != nil {
			tx.RollbackTo("before_idem")
			var pgErr *pgconn.PgError
			isUniqueErr := false
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				isUniqueErr = true
			}
			if err != nil && (strings.Contains(err.Error(), "UNIQUE constraint failed") || strings.Contains(err.Error(), "duplicate key value")) {
				isUniqueErr = true
			}

			if isUniqueErr {
				// Idempotency key already exists. We must fetch the existing payment ID.
				var existingIdem domain.IdempotencyKey
				if err := tx.Where("merchant_id = ? AND idempotency_key = ?", idem.MerchantID, idem.IdempotencyKey).First(&existingIdem).Error; err != nil {
					return err
				}

				if existingIdem.PayloadHash != payloadHash {
					return domain.ErrIdempotencyMismatch
				}

				if existingIdem.PaymentID == nil {
					// Extremely unlikely edge case: Idempotency row exists but no payment ID.
					return errors.New("idempotency record exists but payment ID is null")
				}

				// Payload hashes match — true idempotent replay. Mutate p to existing payment and signal caller.
				var existingPayment domain.Payment
				if err := tx.First(&existingPayment, "id = ?", *existingIdem.PaymentID).Error; err != nil {
					return err
				}
				*p = existingPayment
				return domain.ErrIdempotentHit
			}
			return err
		}

		// 2. Insert Payment
		if err := tx.Create(p).Error; err != nil {
			return err
		}

		// 3. Link Idempotency Key to Payment
		idem.PaymentID = &p.ID
		if err := tx.Save(idem).Error; err != nil {
			return err
		}

		// 4. Insert History
		if err := tx.Create(history).Error; err != nil {
			return err
		}

		return nil
	})

	return p, err
}

func (r *PaymentRepositoryImpl) GetPaymentByID(ctx context.Context, id uuid.UUID, environment string) (*domain.Payment, error) {
	var p domain.Payment
	query := r.db.WithContext(ctx).Where("id = ?", id)
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}
	if err := query.First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrPaymentNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *PaymentRepositoryImpl) GetPaymentsPaginated(ctx context.Context, merchantID uuid.UUID, environment string, limit int, afterCursor *string) ([]*domain.Payment, error) {
	var payments []*domain.Payment
	query := r.db.WithContext(ctx).Where("merchant_id = ?", merchantID)
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}
	query = query.Order("created_at DESC, id DESC").Limit(limit)

	// Since we order by created_at DESC, cursor could be created_at value or ID.
	// For simplicity, let's just use ID for afterCursor since UUIDs are somewhat sortable (v7) or just use basic pagination for now.
	// We'll just do basic pagination by ID.
	if afterCursor != nil && *afterCursor != "" {
		query = query.Where("id < ?", *afterCursor)
	}

	if err := query.Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

func (r *PaymentRepositoryImpl) GetIdempotencyKey(ctx context.Context, merchantID uuid.UUID, key string) (*domain.IdempotencyKey, error) {
	var i domain.IdempotencyKey
	if err := r.db.WithContext(ctx).First(&i, "merchant_id = ? AND idempotency_key = ?", merchantID, key).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No error, just not found
		}
		return nil, err
	}
	return &i, nil
}

func (r *PaymentRepositoryImpl) UpdatePaymentState(ctx context.Context, payment *domain.Payment, history *domain.PaymentStateHistory, outboxEvent *domain.OutboxEvent) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Optimistic Concurrency Control
		res := tx.Model(&domain.Payment{}).
			Where("id = ? AND version = ?", payment.ID, payment.Version).
			Updates(map[string]interface{}{
				"status":  payment.Status,
				"version": payment.Version + 1,
			})
		
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return domain.ErrOptimisticLockFailed
		}

		payment.Version++

		if history != nil {
			if err := tx.Create(history).Error; err != nil {
				return err
			}
		}

		if outboxEvent != nil {
			if err := tx.Create(outboxEvent).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *PaymentRepositoryImpl) CreateRefundWithIdempotency(ctx context.Context, ref *domain.Refund, history *domain.RefundStateHistory, idem *domain.IdempotencyKey, payloadHash string, payment *domain.Payment) (*domain.Refund, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Check/Insert Idempotency Key
		idem.PayloadHash = payloadHash
		tx.SavePoint("before_idem")
		if err := tx.Create(idem).Error; err != nil {
			tx.RollbackTo("before_idem")
			var pgErr *pgconn.PgError
			isUniqueErr := false
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				isUniqueErr = true
			}
			if err != nil && (strings.Contains(err.Error(), "UNIQUE constraint failed") || strings.Contains(err.Error(), "duplicate key value")) {
				isUniqueErr = true
			}

			if isUniqueErr {
				// Idempotent hit on refund! Wait, we don't store refund ID in IdempotencyKey struct...
				// Wait! IdempotencyKey has PaymentID. We should probably just return ErrIdempotencyMismatch if the hash doesn't match.
				// Since we didn't add RefundID to IdempotencyKey, let's look it up by idempotencyKey string directly from Refund table.
				var existingIdem domain.IdempotencyKey
				if err := tx.Where("merchant_id = ? AND idempotency_key = ?", idem.MerchantID, idem.IdempotencyKey).First(&existingIdem).Error; err != nil {
					return err
				}
				if existingIdem.PayloadHash != payloadHash {
					return domain.ErrIdempotencyMismatch
				}
				// Fetch refund by idempotency key string
				var existingRefund domain.Refund
				if err := tx.Where("idempotency_key = ?", idem.IdempotencyKey).First(&existingRefund).Error; err != nil {
					return err
				}
				*ref = existingRefund
				return domain.ErrIdempotentHit
			}
			return err
		}

		// 2. Update Payment RefundedAmount (OCC)
		if payment != nil {
			res := tx.Model(&domain.Payment{}).
				Where("id = ? AND version = ?", payment.ID, payment.Version).
				Updates(map[string]interface{}{
					"refunded_amount": payment.RefundedAmount,
					"version":         payment.Version + 1,
				})
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return domain.ErrOptimisticLockFailed
			}
			payment.Version++
		}

		// 3. Insert Refund
		if err := tx.Create(ref).Error; err != nil {
			return err
		}

		// 4. Insert History
		if err := tx.Create(history).Error; err != nil {
			return err
		}

		return nil
	})

	return ref, err
}

func (r *PaymentRepositoryImpl) GetRefundByID(ctx context.Context, id uuid.UUID, environment string) (*domain.Refund, error) {
	var ref domain.Refund
	query := r.db.WithContext(ctx).Where("id = ?", id)
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}
	if err := query.First(&ref).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("refund not found")
		}
		return nil, err
	}
	return &ref, nil
}

func (r *PaymentRepositoryImpl) UpdateRefundState(ctx context.Context, ref *domain.Refund, history *domain.RefundStateHistory, outboxEvent *domain.OutboxEvent) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Optimistic Concurrency Control
		res := tx.Model(&domain.Refund{}).
			Where("id = ? AND version = ?", ref.ID, ref.Version).
			Updates(map[string]interface{}{
				"status":             ref.Status,
				"provider_refund_id": ref.ProviderRefundID,
				"reason":             ref.Reason,
				"version":            ref.Version + 1,
			})
		
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return domain.ErrOptimisticLockFailed
		}

		ref.Version++

		if history != nil {
			if err := tx.Create(history).Error; err != nil {
				return err
			}
		}

		if outboxEvent != nil {
			if err := tx.Create(outboxEvent).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *PaymentRepositoryImpl) GetRefundsPaginated(ctx context.Context, merchantID uuid.UUID, environment string, paymentID *uuid.UUID, limit int, offset int) ([]*domain.Refund, error) {
	var refunds []*domain.Refund
	query := r.db.WithContext(ctx).Where("merchant_id = ?", merchantID)
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}
	if paymentID != nil {
		query = query.Where("payment_id = ?", *paymentID)
	}
	
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&refunds).Error
	return refunds, err
}

func (r *PaymentRepositoryImpl) CountRefunds(ctx context.Context, merchantID uuid.UUID, environment string, paymentID *uuid.UUID) (int64, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&domain.Refund{}).Where("merchant_id = ?", merchantID)
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}
	if paymentID != nil {
		query = query.Where("payment_id = ?", *paymentID)
	}
	err := query.Count(&count).Error
	return count, err
}

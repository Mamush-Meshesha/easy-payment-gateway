package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"payment-gateway/billing-service/internal/domain"
)

type BillingRepositoryImpl struct {
	db *gorm.DB
}

func NewBillingRepository(db *gorm.DB) *BillingRepositoryImpl {
	return &BillingRepositoryImpl{db: db}
}

func (r *BillingRepositoryImpl) CreatePlan(plan *domain.Plan) error {
	return r.db.Create(plan).Error
}

func (r *BillingRepositoryImpl) GetPlan(id uuid.UUID) (*domain.Plan, error) {
	var plan domain.Plan
	if err := r.db.First(&plan, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *BillingRepositoryImpl) ListPlans(merchantID uuid.UUID) ([]*domain.Plan, error) {
	var plans []*domain.Plan
	query := r.db
	if merchantID != uuid.Nil {
		query = query.Where("merchant_id = ?", merchantID)
	}
	if err := query.Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *BillingRepositoryImpl) CreateSubscription(sub *domain.Subscription) error {
	return r.db.Create(sub).Error
}

func (r *BillingRepositoryImpl) GetSubscription(id uuid.UUID) (*domain.Subscription, error) {
	var sub domain.Subscription
	if err := r.db.Preload("Plan").First(&sub, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *BillingRepositoryImpl) ListSubscriptions(merchantID uuid.UUID) ([]*domain.Subscription, error) {
	var subs []*domain.Subscription
	query := r.db.Preload("Plan")
	if merchantID != uuid.Nil {
		query = query.Where("merchant_id = ?", merchantID)
	}
	if err := query.Find(&subs).Error; err != nil {
		return nil, err
	}
	return subs, nil
}

func (r *BillingRepositoryImpl) UpdateSubscriptionStatus(id uuid.UUID, status domain.SubscriptionStatus) error {
	return r.db.Model(&domain.Subscription{}).Where("id = ?", id).Update("status", status).Error
}

func (r *BillingRepositoryImpl) GetDueSubscriptions(currentTime time.Time) ([]*domain.Subscription, error) {
	var subs []*domain.Subscription
	err := r.db.Preload("Plan").
		Where("status = ?", domain.SubscriptionStatusActive).
		Where("current_period_end <= ?", currentTime).
		Find(&subs).Error
	return subs, err
}

func (r *BillingRepositoryImpl) UpdateSubscriptionPeriod(id uuid.UUID, newStart, newEnd time.Time) error {
	return r.db.Model(&domain.Subscription{}).Where("id = ?", id).Updates(map[string]interface{}{
		"current_period_start": newStart,
		"current_period_end":   newEnd,
	}).Error
}

func (r *BillingRepositoryImpl) CreateInvoice(invoice *domain.Invoice) error {
	return r.db.Create(invoice).Error
}

func (r *BillingRepositoryImpl) UpdateInvoiceStatus(id uuid.UUID, status domain.InvoiceStatus, paymentID *uuid.UUID) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if paymentID != nil {
		updates["payment_id"] = paymentID
	}
	if status == domain.InvoiceStatusPaid {
		updates["paid_at"] = time.Now()
	}
	return r.db.Model(&domain.Invoice{}).Where("id = ?", id).Updates(updates).Error
}

func (r *BillingRepositoryImpl) GetInvoiceByPaymentID(paymentID uuid.UUID) (*domain.Invoice, error) {
	var inv domain.Invoice
	if err := r.db.First(&inv, "payment_id = ?", paymentID).Error; err != nil {
		return nil, err
	}
	return &inv, nil
}

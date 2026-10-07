package domain

import (
	"time"

	"github.com/google/uuid"
)

type Plan struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	MerchantID uuid.UUID `gorm:"type:uuid;not null;index" json:"merchantId"`
	Name       string    `gorm:"type:varchar(255);not null" json:"name"`
	Amount     int64     `gorm:"not null" json:"amount"`
	Currency   string    `gorm:"type:varchar(3);not null" json:"currency"`
	Interval   string    `gorm:"type:varchar(50);not null" json:"interval"` // e.g., "MONTHLY", "YEARLY"
	IsActive   bool      `gorm:"default:true" json:"isActive"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

type SubscriptionStatus string

const (
	SubscriptionStatusActive   SubscriptionStatus = "ACTIVE"
	SubscriptionStatusPastDue  SubscriptionStatus = "PAST_DUE"
	SubscriptionStatusCanceled SubscriptionStatus = "CANCELED"
)

type Subscription struct {
	ID                     uuid.UUID          `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	PlanID                 uuid.UUID          `gorm:"type:uuid;not null;index" json:"planId"`
	CustomerID             string             `gorm:"type:varchar(255);not null;index" json:"customerId"` // External customer reference
	MerchantID             uuid.UUID          `gorm:"type:uuid;not null;index" json:"merchantId"`
	DefaultPaymentMethodID uuid.UUID          `gorm:"type:uuid" json:"defaultPaymentMethodId"`
	Status                 SubscriptionStatus `gorm:"type:varchar(50);not null" json:"status"`
	CurrentPeriodStart     time.Time          `gorm:"not null" json:"currentPeriodStart"`
	CurrentPeriodEnd       time.Time          `gorm:"not null" json:"currentPeriodEnd"`
	CancelAt               *time.Time         `json:"cancelAt"`
	CreatedAt              time.Time          `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt              time.Time          `gorm:"autoUpdateTime" json:"updatedAt"`

	// Associations
	Plan Plan `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
}

type InvoiceStatus string

const (
	InvoiceStatusDraft InvoiceStatus = "DRAFT"
	InvoiceStatusOpen  InvoiceStatus = "OPEN"
	InvoiceStatusPaid  InvoiceStatus = "PAID"
	InvoiceStatusVoid  InvoiceStatus = "VOID"
	InvoiceStatusUncollectible InvoiceStatus = "UNCOLLECTIBLE"
)

type Invoice struct {
	ID             uuid.UUID     `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	SubscriptionID uuid.UUID     `gorm:"type:uuid;not null;index" json:"subscriptionId"`
	MerchantID     uuid.UUID     `gorm:"type:uuid;not null;index" json:"merchantId"`
	CustomerID     string        `gorm:"type:varchar(255);not null" json:"customerId"`
	Amount         int64         `gorm:"not null" json:"amount"`
	Currency       string        `gorm:"type:varchar(3);not null" json:"currency"`
	Status         InvoiceStatus `gorm:"type:varchar(50);not null" json:"status"`
	PaymentID      *uuid.UUID    `gorm:"type:uuid" json:"paymentId"` // Links to payment-service payment
	DueDate        time.Time     `gorm:"not null" json:"dueDate"`
	PaidAt         *time.Time    `json:"paidAt"`
	CreatedAt      time.Time     `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt      time.Time     `gorm:"autoUpdateTime" json:"updatedAt"`

	Subscription Subscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
}

type BillingRepository interface {
	CreatePlan(plan *Plan) error
	GetPlan(id uuid.UUID) (*Plan, error)
	ListPlans(merchantID uuid.UUID) ([]*Plan, error)

	CreateSubscription(sub *Subscription) error
	GetSubscription(id uuid.UUID) (*Subscription, error)
	ListSubscriptions(merchantID uuid.UUID) ([]*Subscription, error)
	UpdateSubscriptionStatus(id uuid.UUID, status SubscriptionStatus) error
	GetDueSubscriptions(currentTime time.Time) ([]*Subscription, error)
	UpdateSubscriptionPeriod(id uuid.UUID, newStart, newEnd time.Time) error

	CreateInvoice(invoice *Invoice) error
	UpdateInvoiceStatus(id uuid.UUID, status InvoiceStatus, paymentID *uuid.UUID) error
	GetInvoiceByPaymentID(paymentID uuid.UUID) (*Invoice, error)
}

type PaymentClient interface {
	ExecutePayment(merchantID, paymentMethodID uuid.UUID, amount int64, currency string, idempotencyKey string) (*uuid.UUID, error)
}

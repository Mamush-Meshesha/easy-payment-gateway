package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type PaymentState string

const (
	StateCreated           PaymentState = "CREATED"
	StateInitiated         PaymentState = "INITIATED"
	StateProcessing        PaymentState = "PROCESSING"
	StatePending           PaymentState = "PENDING"
	StateUnknown           PaymentState = "UNKNOWN"
	StateCompletionPending PaymentState = "COMPLETION_PENDING"
	StateSucceeded         PaymentState = "SUCCEEDED"
	StateFailed            PaymentState = "FAILED"
	StateCancelled         PaymentState = "CANCELLED"
	StateExpired           PaymentState = "EXPIRED"
)

type Payment struct {
	ID                uuid.UUID    `json:"id" gorm:"type:uuid;primary_key"`
	MerchantID        uuid.UUID    `json:"merchantId" gorm:"type:uuid;index"`
	Environment       string       `json:"environment" gorm:"type:varchar(10);not null;default:'LIVE'"`
	MerchantReference string       `json:"merchantReference" gorm:"type:varchar(255);index"`
	Amount            int64        `json:"amount" gorm:"not null"` // in lowest denomination
	RefundedAmount    int64        `json:"refundedAmount" gorm:"not null;default:0"`
	Currency          string       `json:"currency" gorm:"type:varchar(3);not null"`
	Status            PaymentState `json:"status" gorm:"type:varchar(30);not null"`
	ProviderID        *uuid.UUID   `json:"providerId" gorm:"type:uuid;index"`
	CustomerID        string       `json:"customerId" gorm:"type:varchar(255)"`
	IPAddress         string       `json:"ipAddress" gorm:"type:varchar(45)"`
	PaymentMethod     string       `json:"paymentMethod" gorm:"type:varchar(100)"`
	Version           int64        `json:"version" gorm:"not null;default:1"` // OCC
	CreatedAt         time.Time    `json:"createdAt"`
	UpdatedAt         time.Time    `json:"updatedAt"`
}

type PaymentStateHistory struct {
	ID         uuid.UUID    `gorm:"type:uuid;primary_key"`
	PaymentID  uuid.UUID    `gorm:"type:uuid;index"`
	FromStatus PaymentState `gorm:"type:varchar(30)"`
	ToStatus   PaymentState `gorm:"type:varchar(30);not null"`
	Reason     string       `gorm:"type:varchar(255)"`
	CreatedAt  time.Time
}

type RefundState string

const (
	RefundStateRequested RefundState = "REQUESTED"
	RefundStatePending   RefundState = "PENDING"
	RefundStateRefunded  RefundState = "REFUNDED"
	RefundStateFailed    RefundState = "FAILED"
	RefundStateUnknown   RefundState = "UNKNOWN"
)

type Refund struct {
	ID               uuid.UUID   `json:"id" gorm:"type:uuid;primary_key"`
	PaymentID        uuid.UUID   `json:"paymentId" gorm:"type:uuid;index;not null"`
	MerchantID       uuid.UUID   `json:"merchantId" gorm:"type:uuid;index;not null"`
	Environment      string      `json:"environment" gorm:"type:varchar(10);not null;default:'LIVE'"`
	Amount           int64       `json:"amount" gorm:"not null"`
	Currency         string      `json:"currency" gorm:"type:varchar(3);not null"`
	Status           RefundState `json:"status" gorm:"type:varchar(30);not null"`
	Reason           string      `json:"reason" gorm:"type:varchar(255)"`
	IdempotencyKey   string      `json:"idempotencyKey" gorm:"type:varchar(255);not null;uniqueIndex:idx_refund_idem"`
	ProviderRefundID *string     `json:"providerRefundId" gorm:"type:varchar(255)"`
	Version          int64       `json:"version" gorm:"not null;default:1"` // OCC
	CreatedAt        time.Time   `json:"createdAt"`
	UpdatedAt        time.Time   `json:"updatedAt"`
}

type RefundStateHistory struct {
	ID         uuid.UUID   `gorm:"type:uuid;primary_key"`
	RefundID   uuid.UUID   `gorm:"type:uuid;index"`
	FromStatus RefundState `gorm:"type:varchar(30)"`
	ToStatus   RefundState `gorm:"type:varchar(30);not null"`
	Reason     string      `gorm:"type:varchar(255)"`
	CreatedAt  time.Time
}

type IdempotencyKey struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key"`
	MerchantID     uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_merchant_idem"`
	IdempotencyKey string    `gorm:"type:varchar(255);uniqueIndex:idx_merchant_idem"`
	PaymentID      *uuid.UUID `gorm:"type:uuid"`
	Status         string    `gorm:"type:varchar(20)"`
	PayloadHash    string    `gorm:"type:varchar(255)"` // to verify the request payload hasn't changed
	CreatedAt      time.Time
}

type OutboxEvent struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key"`
	AggregateType string    `gorm:"type:varchar(100);not null"`
	AggregateID   string    `gorm:"type:varchar(255);not null"`
	EventType     string    `gorm:"type:varchar(100);not null"`
	Payload       string    `gorm:"type:jsonb;not null"`
	Status        string    `gorm:"type:varchar(20);not null;default:'PENDING'"`
	CreatedAt     time.Time
}

// TableName overrides the default GORM table name
func (OutboxEvent) TableName() string {
	return "payment_outbox_events"
}

// Helper to serialize event payloads
func (o *OutboxEvent) SetPayload(v interface{}) error {
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	o.Payload = string(b)
	return nil
}

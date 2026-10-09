package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type WebhookState string

const (
	StatePending      WebhookState = "PENDING"
	StateDelivering   WebhookState = "DELIVERING"
	StateDelivered    WebhookState = "DELIVERED"
	StateRetryWait    WebhookState = "RETRY_WAIT"
	StateDeadLettered WebhookState = "DEAD_LETTERED"
)

type Delivery struct {
	ID           uuid.UUID    `gorm:"type:uuid;primaryKey"` // This maps 1:1 to Kafka eventId
	Environment  string       `gorm:"type:varchar(10);not null;default:'LIVE'"`
	EventType    string       `gorm:"type:varchar(100);not null"`
	EventVersion int          `gorm:"not null;default:1"`
	PaymentID    uuid.UUID    `gorm:"type:uuid;not null"`
	MerchantID   uuid.UUID    `gorm:"type:uuid;not null"`
	URL          string       `gorm:"type:varchar(255);not null"`
	Payload      string       `gorm:"type:jsonb;not null"`
	Status       WebhookState `gorm:"type:varchar(20);not null"`
	AttemptCount int          `gorm:"not null;default:0"`
	NextRetryAt  time.Time
	LockedAt     *time.Time
	LockedBy     *string `gorm:"type:varchar(255)"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	LastError    *string
}

func (d *Delivery) SetPayload(v interface{}) error {
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	d.Payload = string(b)
	return nil
}

type Attempt struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	DeliveryID     uuid.UUID `gorm:"type:uuid;not null;index"`
	AttemptNumber  int       `gorm:"not null"`
	StartedAt      time.Time `gorm:"not null"`
	CompletedAt    *time.Time
	HTTPStatus     *int
	ResponseTimeMs *int64
	ErrorCode      *string `gorm:"type:varchar(50)"`
	ErrorMessage   *string
	CreatedAt      time.Time
}

func (Delivery) TableName() string {
	return "webhook.deliveries"
}

func (Attempt) TableName() string {
	return "webhook.attempts"
}

// PaymentStatusChangedEvent is the expected Kafka input from Payment Service
type PaymentStatusChangedEvent struct {
	PaymentID         string `json:"paymentId"`
	MerchantID        string `json:"merchantId"`
	Environment       string `json:"environment"` // TEST or LIVE
	MerchantReference string `json:"merchantReference"`
	PreviousStatus    string `json:"previousStatus"`
	NewStatus         string `json:"status"` // The payload usually maps "status" instead of "newStatus", matching our orchestrator's outbox.
	Amount            int64  `json:"amount"`
	Currency          string `json:"currency"`
	Timestamp         string `json:"timestamp"`
}

// CanonicalDeliveryEnvelope is the structure we send to the merchant
type CanonicalDeliveryEnvelope struct {
	EventID           string `json:"eventId"`
	EventType         string `json:"eventType"`
	EventVersion      int    `json:"eventVersion"`
	PaymentID         string `json:"paymentId"`
	MerchantReference string `json:"merchantReference"`
	Status            string `json:"status"`
	Amount            int64  `json:"amount"`
	Currency          string `json:"currency"`
	OccurredAt        string `json:"occurredAt"`
}

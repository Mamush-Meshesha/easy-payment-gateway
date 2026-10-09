package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID                    uuid.UUID `gorm:"type:uuid;primary_key"`
	PaymentID             uuid.UUID `gorm:"type:uuid;index"`
	ProviderID            uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_provider_tx,priority:1"`
	ProviderTransactionID string    `gorm:"type:varchar(255);uniqueIndex:idx_provider_tx,priority:2"`
	Amount                int64     `gorm:"not null"`
	Currency              string    `gorm:"type:varchar(3);not null"`
	Status                string    `gorm:"type:varchar(20);not null"`
	CreatedAt             time.Time
	UpdatedAt             time.Time
}

func (Transaction) TableName() string {
	return "transaction.transactions"
}

type OutboxEvent struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key"`
	EventType string    `gorm:"type:varchar(100);not null"`
	Payload   string    `gorm:"type:jsonb;not null"`
	Status    string    `gorm:"type:varchar(20);not null;default:'PENDING'"`
	CreatedAt time.Time
}

func (OutboxEvent) TableName() string {
	return "transaction.outbox_events"
}

func (o *OutboxEvent) SetPayload(v interface{}) error {
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	o.Payload = string(b)
	return nil
}

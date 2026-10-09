package models

import (
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID                    uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	PaymentID             uuid.UUID `gorm:"type:uuid;not null;index"` // Logical Ref
	ProviderID            uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:uq_trans_provider_external"` // Logical Ref
	ProviderTransactionID string    `gorm:"type:varchar(255);not null;uniqueIndex:uq_trans_provider_external"`
	Amount                int64     `gorm:"type:bigint;not null"`
	Currency              string    `gorm:"type:varchar(3);not null"`
	Status                string    `gorm:"type:varchar(20);not null"`
	CreatedAt             time.Time `gorm:"type:timestamptz;not null;default:now()"`
	UpdatedAt             time.Time `gorm:"type:timestamptz"`

	StatusHistory []TransactionStatusHistory `gorm:"foreignKey:TransactionID"`
}

type TransactionStatusHistory struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	TransactionID uuid.UUID `gorm:"type:uuid;not null;index"`
	Status        string    `gorm:"type:varchar(20);not null"`
	Reason        string    `gorm:"type:varchar(255)"`
	CreatedAt     time.Time `gorm:"type:timestamptz;not null;default:now()"`
}

func (Transaction) TableName() string {
	return "transaction.transactions"
}

func (TransactionStatusHistory) TableName() string {
	return "transaction.transaction_status_histories"
}

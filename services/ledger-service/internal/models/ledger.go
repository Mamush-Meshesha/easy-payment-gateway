package models

import (
	"time"

	"github.com/google/uuid"
)

type Account struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	AccountCode string    `gorm:"type:varchar(50);uniqueIndex;not null"`
	AccountType string    `gorm:"type:varchar(20);not null"` // ASSET, LIABILITY, REVENUE, EXPENSE
	OwnerType   string    `gorm:"type:varchar(20);not null"` // MERCHANT, PROVIDER, SYSTEM
	OwnerID     uuid.UUID `gorm:"type:uuid;not null"` // Logical ref to owner
	Currency    string    `gorm:"type:varchar(3);not null"`
}

type JournalEntry struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ReferenceType string    `gorm:"type:varchar(50);not null"` // PAYMENT, REFUND, SETTLEMENT
	ReferenceID   uuid.UUID `gorm:"type:uuid;not null;index"`
	Currency      string    `gorm:"type:varchar(3);not null"`
	CreatedAt     time.Time `gorm:"type:timestamptz;not null;default:now()"`

	Lines []JournalLine `gorm:"foreignKey:JournalEntryID"`
}

type JournalLine struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	JournalEntryID uuid.UUID `gorm:"type:uuid;not null;index"`
	AccountID      uuid.UUID `gorm:"type:uuid;not null;index"`
	Direction      string    `gorm:"type:varchar(10);not null"` // DEBIT, CREDIT
	Amount         int64     `gorm:"type:bigint;not null;check:amount > 0"`
}

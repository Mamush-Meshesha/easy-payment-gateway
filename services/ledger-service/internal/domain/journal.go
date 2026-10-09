package domain

import (
	"time"

	"github.com/google/uuid"
)

type JournalDirection string

const (
	DirectionDebit  JournalDirection = "DEBIT"
	DirectionCredit JournalDirection = "CREDIT"
)

type JournalEntry struct {
	ID                    uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey"`
	ReferenceType         string        `json:"referenceType" gorm:"type:varchar(50);not null;uniqueIndex:idx_reference"`
	ReferenceID           string        `json:"referenceId" gorm:"type:varchar(255);not null;uniqueIndex:idx_reference"`
	Environment           string        `json:"environment" gorm:"type:varchar(10);not null;default:'LIVE'"`
	ProviderID            *uuid.UUID    `json:"providerId" gorm:"type:uuid;index"`
	ProviderTransactionID *string       `json:"providerTransactionId" gorm:"type:varchar(255);index"`
	Currency              string        `json:"currency" gorm:"type:varchar(3);not null"`
	CreatedAt             time.Time     `json:"createdAt" gorm:"autoCreateTime"`
	Lines                 []JournalLine `json:"lines" gorm:"foreignKey:JournalEntryID"`
}

type JournalLine struct {
	ID             uuid.UUID        `json:"id" gorm:"type:uuid;primaryKey"`
	JournalEntryID uuid.UUID        `json:"journalEntryId" gorm:"type:uuid;not null"`
	AccountID      uuid.UUID        `json:"accountId" gorm:"type:uuid;not null;index"`
	Direction      JournalDirection `json:"direction" gorm:"type:varchar(10);not null"`
	Amount         int64            `json:"amount" gorm:"not null"` // MUST be > 0
	CreatedAt      time.Time        `json:"createdAt" gorm:"primaryKey;autoCreateTime"`
}

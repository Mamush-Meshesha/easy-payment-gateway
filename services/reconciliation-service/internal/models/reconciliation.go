package models

import (
	"time"

	"github.com/google/uuid"
)

type ReconciliationRun struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProviderID  uuid.UUID  `gorm:"type:uuid;not null;index"`
	TargetDate  time.Time  `gorm:"type:date;not null"`
	Status      string     `gorm:"type:varchar(20);not null;default:'PENDING'"`
	CreatedAt   time.Time  `gorm:"type:timestamptz;not null;default:now()"`
	CompletedAt *time.Time `gorm:"type:timestamptz"`

	Mismatches []ReconciliationMismatch `gorm:"foreignKey:RunID"`
}

type ReconciliationMismatch struct {
	ID                    uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	RunID                 uuid.UUID `gorm:"type:uuid;not null;index"`
	ProviderRecordID      uuid.UUID `gorm:"type:uuid"`                 // Reference to imported file record
	InternalTransactionID uuid.UUID `gorm:"type:uuid"`                 // Reference to internal transaction
	MismatchType          string    `gorm:"type:varchar(50);not null"` // e.g. MISSING_IN_INTERNAL, AMOUNT_MISMATCH
	Status                string    `gorm:"type:varchar(20);not null;default:'UNRESOLVED'"`
}

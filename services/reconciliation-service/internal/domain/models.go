package domain

import (
	"time"

	"github.com/google/uuid"
)

type JobStatus string

const (
	JobStatusPending    JobStatus = "PENDING"
	JobStatusProcessing JobStatus = "PROCESSING"
	JobStatusCompleted  JobStatus = "COMPLETED"
	JobStatusFailed     JobStatus = "FAILED"
)

type ExceptionType string

const (
	ExceptionMissingInLedger       ExceptionType = "MISSING_IN_LEDGER"
	ExceptionMissingInProvider     ExceptionType = "MISSING_IN_PROVIDER"
	ExceptionAmountMismatch        ExceptionType = "AMOUNT_MISMATCH"
	ExceptionStatusMismatch        ExceptionType = "STATUS_MISMATCH"
	ExceptionCurrencyMismatch      ExceptionType = "CURRENCY_MISMATCH"
	ExceptionDuplicateProviderRec  ExceptionType = "DUPLICATE_PROVIDER_RECORD"
	ExceptionDuplicateInternalRec  ExceptionType = "DUPLICATE_INTERNAL_RECORD"
	ExceptionUnexpectedFee         ExceptionType = "UNEXPECTED_FEE"
)

type ExceptionStatus string

const (
	ExceptionStatusUnresolved             ExceptionStatus = "UNRESOLVED"
	ExceptionStatusResolved               ExceptionStatus = "RESOLVED"
	ExceptionStatusResolutionAttempted    ExceptionStatus = "RESOLUTION_ATTEMPTED"
)

type ActionType string

const (
	ActionCreated             ActionType = "CREATED"
	ActionReviewed            ActionType = "REVIEWED"
	ActionResolutionAttempted ActionType = "RESOLUTION_ATTEMPTED"
	ActionResolved            ActionType = "RESOLVED"
)

type ReconciliationStatement struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
	ProviderID    uuid.UUID `gorm:"type:uuid;not null;index"`
	StatementDate time.Time `gorm:"type:date;not null"`
	FileName      string    `gorm:"type:varchar(255);not null"`
	FileHash      string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_statement_hash"`
	RecordCount   int       `gorm:"not null"`
	UploadedAt    time.Time `gorm:"autoCreateTime"`
}

type ReconciliationJob struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey"`
	StatementID      uuid.UUID `gorm:"type:uuid;not null"`
	Status           JobStatus `gorm:"type:varchar(20);not null"`
	TotalRecords     int       `gorm:"not null;default:0"`
	MatchedRecords   int       `gorm:"not null;default:0"`
	ExceptionRecords int       `gorm:"not null;default:0"`
	CreatedAt        time.Time `gorm:"autoCreateTime"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime"`
}

type ReconciliationException struct {
	ID                    uuid.UUID       `gorm:"type:uuid;primaryKey"`
	JobID                 uuid.UUID       `gorm:"type:uuid;not null;index"`
	ProviderTransactionID string          `gorm:"type:varchar(255);index"`
	InternalPaymentID     *uuid.UUID      `gorm:"type:uuid;index"`
	ExceptionType         ExceptionType   `gorm:"type:varchar(50);not null"`
	ProviderAmount        *int64
	ProviderCurrency      *string         `gorm:"type:varchar(3)"`
	LedgerAmount          *int64
	LedgerCurrency        *string         `gorm:"type:varchar(3)"`
	Status                ExceptionStatus `gorm:"type:varchar(30);not null;default:'UNRESOLVED'"`
	CreatedAt             time.Time       `gorm:"autoCreateTime"`
	UpdatedAt             time.Time       `gorm:"autoUpdateTime"`
}

type ReconciliationExceptionAction struct {
	ID                  uuid.UUID  `gorm:"type:uuid;primaryKey"`
	ExceptionID         uuid.UUID  `gorm:"type:uuid;not null;index"`
	Action              ActionType `gorm:"type:varchar(30);not null"`
	ResolvedBy          string     `gorm:"type:varchar(255);not null"`
	ResolutionReason    string     `gorm:"type:text;not null"`
	ResolutionReference string     `gorm:"type:varchar(255)"`
	CreatedAt           time.Time  `gorm:"autoCreateTime"`
}

// ProviderRecord is the normalized struct that the StatementSource yields.
type ProviderRecord struct {
	ProviderTransactionID string
	Amount                int64
	Currency              string
	Status                string
	RawRowData            string // The original raw CSV row for debugging
}

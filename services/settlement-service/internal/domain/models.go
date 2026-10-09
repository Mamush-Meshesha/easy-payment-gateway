package domain

import (
	"time"

	"github.com/google/uuid"
)

type PayoutState string

const (
	StateCreated       PayoutState = "CREATED"
	StateReserving     PayoutState = "RESERVING"
	StateFundsReserved PayoutState = "FUNDS_RESERVED"
	StateSubmitting    PayoutState = "SUBMITTING"
	StateProcessing    PayoutState = "PROCESSING"
	StateUnknown       PayoutState = "UNKNOWN"
	StateCompleted     PayoutState = "COMPLETED"
	StateFailed        PayoutState = "FAILED"
	StateReleasing     PayoutState = "RELEASING"
	StateReleased      PayoutState = "RELEASED"
)

// Payout represents a settlement instruction moving funds to a merchant's bank account.
type Payout struct {
	ID                   uuid.UUID   `json:"id" gorm:"type:uuid;primaryKey"`
	MerchantID           uuid.UUID   `json:"merchantId" gorm:"type:uuid;not null;uniqueIndex:idx_merchant_idemp"`
	Currency             string      `json:"currency" gorm:"type:varchar(3);not null"`
	Amount               int64       `json:"amount" gorm:"not null"`
	Status               PayoutState `json:"status" gorm:"type:varchar(30);not null"`
	IdempotencyKey       string      `json:"idempotencyKey" gorm:"type:varchar(100);not null;uniqueIndex:idx_merchant_idemp"`
	LedgerReservationRef string      `json:"ledgerReservationRef" gorm:"type:varchar(100)"`
	ProviderReference    string      `json:"providerReference" gorm:"type:varchar(100)"`
	DestinationToken     string      `json:"destinationToken" gorm:"type:varchar(255)"`  // Tokenized destination reference
	DestinationBank      string      `json:"destinationBank" gorm:"type:varchar(100)"`
	CreatedAt            time.Time   `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt            time.Time   `json:"updatedAt" gorm:"autoUpdateTime"`
}

package domain

import (
	"context"

	"github.com/google/uuid"
)

type RecordEntryRequest struct {
	ReferenceType         string
	ReferenceID           string
	ProviderID            *string
	ProviderTransactionID *string
	Currency              string
	Environment           string
	Lines                 []RecordLineRequest
}

type RecordLineRequest struct {
	AccountID uuid.UUID
	Direction JournalDirection
	Amount    int64
}

// Repository Interface
type LedgerRepository interface {
	RecordJournalEntry(ctx context.Context, entry *JournalEntry, outboxEvent *OutboxEvent) error
	GetJournalEntryByReference(ctx context.Context, refType, refID string) (*JournalEntry, error)
	GetAccountByID(ctx context.Context, id uuid.UUID) (*Account, error)
	GetJournalEntriesByProviderReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]JournalEntry, error)

	ReserveFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, referenceID string) error
	ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error
	CompleteSettlement(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error

	GetAccountsByMerchant(ctx context.Context, merchantID uuid.UUID, environment string, currency *string) ([]Account, error)
	GetLedgerEntriesPaginated(ctx context.Context, merchantID uuid.UUID, environment string, currency *string, limit int, afterCursor *string) ([]JournalEntry, error)
	FreezeAccounts(ctx context.Context, merchantID uuid.UUID) error
}

// Service Interface
type LedgerService interface {
	RecordTransaction(ctx context.Context, req *RecordEntryRequest) (*JournalEntry, error)
	GetAccountBalance(ctx context.Context, accountID string) (*Account, error)
	GetJournalEntry(ctx context.Context, refType, refID string) (*JournalEntry, error)
	GetJournalEntriesByProviderReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]JournalEntry, error)

	ReserveFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, referenceID string) error
	ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error
	CompleteSettlement(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error

	GetAccountsByMerchant(ctx context.Context, merchantID uuid.UUID, environment string, currency *string) ([]Account, error)
	GetLedgerEntriesPaginated(ctx context.Context, merchantID uuid.UUID, environment string, currency *string, limit int, afterCursor *string) ([]JournalEntry, error)
	FreezeAccounts(ctx context.Context, merchantID uuid.UUID) error
}

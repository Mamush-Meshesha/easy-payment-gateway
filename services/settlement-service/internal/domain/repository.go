package domain

import (
	"context"

	"github.com/google/uuid"
)

type PayoutRepository interface {
	CreatePayout(ctx context.Context, payout *Payout) error
	GetPayoutByID(ctx context.Context, id uuid.UUID) (*Payout, error)
	GetPayoutByIdempotencyKey(ctx context.Context, merchantID uuid.UUID, idempotencyKey string) (*Payout, error)
	UpdatePayoutState(ctx context.Context, id uuid.UUID, expectedState PayoutState, newState PayoutState, providerRef *string) error
	GetPayoutsPaginated(ctx context.Context, merchantID uuid.UUID, limit int, offset int) ([]*Payout, error)
	CountPayouts(ctx context.Context, merchantID uuid.UUID) (int64, error)
}

type LedgerClient interface {
	ReserveFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error
	ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error
	CompleteSettlement(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error
}

type MerchantClient interface {
	// Returns (DestinationAccount, DestinationBank, error)
	GetPayoutDestination(ctx context.Context, merchantID uuid.UUID, currency string) (string, string, error)
}

package domain

import "context"

type PayoutResultStatus string

const (
	ProviderStatusSuccess PayoutResultStatus = "SUCCESS"
	ProviderStatusPending PayoutResultStatus = "PENDING"
	ProviderStatusFailed  PayoutResultStatus = "FAILED"
	ProviderStatusUnknown PayoutResultStatus = "UNKNOWN"
)

type PayoutRequest struct {
	ReferenceID      string
	Amount           int64
	Currency         string
	DestinationToken string
	DestinationBank  string
}

type PayoutResult struct {
	Status            PayoutResultStatus
	ProviderReference string
}

type PayoutProvider interface {
	InitiatePayout(ctx context.Context, req PayoutRequest) (PayoutResult, error)
	GetPayoutStatus(ctx context.Context, reference string) (PayoutResult, error)
}

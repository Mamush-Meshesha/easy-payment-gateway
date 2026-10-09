package domain

import (
	"context"
)

type ProviderNormalizedEvent struct {
	EventID               string      `json:"eventId"`
	ProviderID            string      `json:"providerId"`
	ProviderTransactionID string      `json:"providerTransactionId"`
	PaymentID             string      `json:"paymentId"`
	Status                string      `json:"status"` // SUCCESS, FAILED, PENDING
	RawPayload            interface{} `json:"rawPayload"`
	Timestamp             string      `json:"timestamp"`
}

type TransactionRepository interface {
	// UpsertTransaction atomically inserts or updates a transaction and inserts an outbox event.
	// It relies on the idx_provider_tx unique constraint for safety.
	UpsertTransaction(ctx context.Context, tx *Transaction) error
}

type TransactionService interface {
	ProcessProviderEvent(ctx context.Context, event ProviderNormalizedEvent) error
}

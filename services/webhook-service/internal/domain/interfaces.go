package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type WebhookRepository interface {
	// IdempotentInsertDelivery inserts the delivery using EventID as the Primary Key.
	// Returns true if inserted, false if it already existed (idempotency hit).
	IdempotentInsertDelivery(ctx context.Context, delivery *Delivery) (bool, error)

	// ClaimDeliveries locks up to limit rows that are PENDING or RETRY_WAIT and next_retry_at <= NOW().
	ClaimDeliveries(ctx context.Context, workerID string, limit int) ([]Delivery, error)

	// SaveAttempt records the attempt and updates the Delivery state within a single transaction.
	SaveAttempt(ctx context.Context, delivery *Delivery, attempt *Attempt) error

	// UnlockStaleDeliveries releases locks for deliveries stuck in DELIVERING for > timeout.
	UnlockStaleDeliveries(ctx context.Context, timeoutMinutes int) (int64, error)

	GetDeliveriesByMerchantID(ctx context.Context, merchantID uuid.UUID, limit int, offset int) ([]Delivery, error)
	CountDeliveriesByMerchantID(ctx context.Context, merchantID uuid.UUID) (int64, error)
	ReplayDelivery(ctx context.Context, deliveryID uuid.UUID, merchantID uuid.UUID) error
}

type WebhookConfig struct {
	URL                 string
	PrimarySecret       string
	SecondarySecret     string
	SecondaryExpiresAt  *time.Time
}

type MerchantClient interface {
	// GetWebhookConfig returns the webhook configuration for the merchant.
	GetWebhookConfig(ctx context.Context, merchantID uuid.UUID, environment string) (*WebhookConfig, error)
}

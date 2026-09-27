package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type PaymentRequest struct {
	IdempotencyKey    string
	MerchantID        uuid.UUID // Resolved from API Key
	Environment       string    // Resolved from API Key (TEST or LIVE)
	APIKey            string
	MerchantReference string
	Amount            int64
	Currency          string
	CustomerID        string
	IPAddress         string
	PaymentMethod     string
	ProviderID        uuid.UUID
}

type PaymentResponse struct {
	PaymentID uuid.UUID    `json:"id"`
	Status    PaymentState `json:"status"`
	Reason    string       `json:"reason,omitempty"`
}

type RefundRequest struct {
	IdempotencyKey string
	PaymentID      uuid.UUID
	Amount         int64
	Reason         string
	APIKey         string
	Environment    string
}

type RefundResponse struct {
	RefundID uuid.UUID   `json:"id"`
	Status   RefundState `json:"status"`
	Reason   string      `json:"reason,omitempty"`
}

type PaymentRepository interface {
	CreatePaymentWithIdempotency(ctx context.Context, p *Payment, history *PaymentStateHistory, idem *IdempotencyKey, payloadHash string) (*Payment, error)
	GetPaymentByID(ctx context.Context, id uuid.UUID, environment string) (*Payment, error)
	GetPaymentsPaginated(ctx context.Context, merchantID uuid.UUID, environment string, limit int, afterCursor *string) ([]*Payment, error)
	GetIdempotencyKey(ctx context.Context, merchantID uuid.UUID, key string) (*IdempotencyKey, error)
	UpdatePaymentState(ctx context.Context, payment *Payment, history *PaymentStateHistory, outboxEvent *OutboxEvent) error
	
	// Refund Methods
	CreateRefundWithIdempotency(ctx context.Context, r *Refund, history *RefundStateHistory, idem *IdempotencyKey, payloadHash string, payment *Payment) (*Refund, error)
	GetRefundByID(ctx context.Context, id uuid.UUID, environment string) (*Refund, error)
	UpdateRefundState(ctx context.Context, refund *Refund, history *RefundStateHistory, outboxEvent *OutboxEvent) error
	GetRefundsPaginated(ctx context.Context, merchantID uuid.UUID, environment string, paymentID *uuid.UUID, limit int, offset int) ([]*Refund, error)
	CountRefunds(ctx context.Context, merchantID uuid.UUID, environment string, paymentID *uuid.UUID) (int64, error)
}

// Client abstractions for outbound gRPC calls
type MerchantConfig struct {
	Version               int
	FeeRouting            string
	EnabledPaymentMethods []string
	// CachedAt records when this entry was written to the cache.
	// Used by the orchestrator to enforce a shorter staleness bound
	// for security-relevant fields (e.g. EnabledPaymentMethods).
	CachedAt              time.Time
}

type MerchantClient interface {
	ValidateApiKey(ctx context.Context, apiKey string) (isValid bool, merchantID uuid.UUID, env string, err error)
	GetMerchantConfig(ctx context.Context, merchantID uuid.UUID) (config MerchantConfig, err error)
	GetMerchantName(ctx context.Context, merchantID uuid.UUID) (string, error)
}

type MerchantConfigCache interface {
	Get(ctx context.Context, merchantID uuid.UUID) (*MerchantConfig, error)
	Set(ctx context.Context, merchantID uuid.UUID, config MerchantConfig, ttl time.Duration) error
	// Delete explicitly invalidates the cache entry for a merchant.
	// Used by the Kafka consumer when a config update arrives so the next
	// payment synchronously re-fetches the authoritative value from merchant-service.
	Delete(ctx context.Context, merchantID uuid.UUID) error
}

type RiskClient interface {
	CheckRisk(ctx context.Context, req *Payment) (action string, reason string, err error)
}

type ProviderClient interface {
	InitiatePayment(ctx context.Context, paymentID uuid.UUID, providerID uuid.UUID, amount int64, currency string, environment string) (status string, err error) // Status can be SUCCESS, PENDING, FAILED, TIMEOUT
	InitiateRefund(ctx context.Context, refundID uuid.UUID, providerID uuid.UUID, amount int64, currency string, originalProviderID *string, environment string) (status string, err error)
}

type LedgerClient interface {
	RecordJournalEntry(ctx context.Context, paymentID uuid.UUID, providerID string, providerTransactionID string, amount int64, currency string, environment string) (status string, err error) // Status COMMITTED, TIMEOUT
	RecordRefundJournalEntry(ctx context.Context, refundID uuid.UUID, paymentID uuid.UUID, amount int64, currency string, environment string) (status string, err error)
}

type PaymentOrchestrator interface {
	ProcessPayment(ctx context.Context, req *PaymentRequest, payloadHash string) (*PaymentResponse, error)
	ResolvePaymentStatus(ctx context.Context, paymentID uuid.UUID, providerStatus string, providerID string, providerTransactionID string) error
	
	ProcessRefund(ctx context.Context, req *RefundRequest, payloadHash string) (*RefundResponse, error)
	GetPaymentByID(ctx context.Context, paymentID uuid.UUID) (*Payment, error)
	GetMerchantName(ctx context.Context, merchantID uuid.UUID) (string, error)
	GetAllowedPaymentMethods(ctx context.Context, merchantID uuid.UUID) ([]string, error)
}

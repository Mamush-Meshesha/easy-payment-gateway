package service

import (
	"context"
	"errors"
	"payment-gateway/payment-service/internal/domain"
	"testing"
	"time"

	"github.com/google/uuid"
)

// Mocks

type MockPaymentRepo struct {
	payment *domain.Payment
}

func (m *MockPaymentRepo) CreatePaymentWithIdempotency(ctx context.Context, p *domain.Payment, h *domain.PaymentStateHistory, i *domain.IdempotencyKey, payloadHash string) (*domain.Payment, error) {
	m.payment = p
	return p, nil
}
func (m *MockPaymentRepo) UpdatePaymentState(ctx context.Context, p *domain.Payment, h *domain.PaymentStateHistory, o *domain.OutboxEvent) error {
	m.payment = p
	return nil
}
func (m *MockPaymentRepo) GetPaymentByID(ctx context.Context, id uuid.UUID, env string) (*domain.Payment, error) {
	return m.payment, nil
}
func (m *MockPaymentRepo) GetPaymentsPaginated(ctx context.Context, merchantID uuid.UUID, environment string, limit int, afterCursor *string) ([]*domain.Payment, error) {
	return nil, nil
}
func (m *MockPaymentRepo) GetIdempotencyKey(ctx context.Context, merchantID uuid.UUID, key string) (*domain.IdempotencyKey, error) {
	return nil, nil
}
func (m *MockPaymentRepo) PruneIdempotencyKeys(ctx context.Context, olderThan time.Time) (int64, error) {
	return 0, nil
}
func (m *MockPaymentRepo) CreateRefundWithIdempotency(ctx context.Context, r *domain.Refund, h *domain.RefundStateHistory, i *domain.IdempotencyKey, payloadHash string, p *domain.Payment) (*domain.Refund, error) {
	return nil, nil
}
func (m *MockPaymentRepo) UpdateRefundState(ctx context.Context, r *domain.Refund, h *domain.RefundStateHistory, o *domain.OutboxEvent) error {
	return nil
}
func (m *MockPaymentRepo) GetRefundByID(ctx context.Context, id uuid.UUID, environment string) (*domain.Refund, error) {
	return nil, nil
}
func (m *MockPaymentRepo) GetRefundsPaginated(ctx context.Context, merchantID uuid.UUID, environment string, paymentID *uuid.UUID, limit int, offset int) ([]*domain.Refund, error) {
	return nil, nil
}
func (m *MockPaymentRepo) CountRefunds(ctx context.Context, merchantID uuid.UUID, environment string, paymentID *uuid.UUID) (int64, error) {
	return 0, nil
}

type MockMerchantClient struct{}

func (m *MockMerchantClient) ValidateApiKey(ctx context.Context, apiKey string) (bool, uuid.UUID, string, error) {
	return true, uuid.New(), "sandbox", nil
}
func (m *MockMerchantClient) GetMerchantConfig(ctx context.Context, merchantID uuid.UUID) (domain.MerchantConfig, error) {
	return domain.MerchantConfig{EnabledPaymentMethods: []string{"CARD"}}, nil
}
func (m *MockMerchantClient) GetMerchantName(ctx context.Context, merchantID uuid.UUID) (string, error) {
	return "Mock Merchant", nil
}

type MockCache struct{}

func (m *MockCache) Get(ctx context.Context, merchantID uuid.UUID) (*domain.MerchantConfig, error) {
	return nil, errors.New("miss")
}
func (m *MockCache) Set(ctx context.Context, merchantID uuid.UUID, config domain.MerchantConfig, ttl time.Duration) error {
	return nil
}
func (m *MockCache) Delete(ctx context.Context, merchantID uuid.UUID) error { return nil }

type MockProvider struct{}

func (m *MockProvider) InitiatePayment(ctx context.Context, paymentID, providerID uuid.UUID, amount int64, currency, env string) (string, error) {
	return "SUCCESS", nil
}
func (m *MockProvider) InitiateRefund(ctx context.Context, refundID, providerID uuid.UUID, amount int64, currency string, reason *string, env string) (string, error) {
	return "SUCCESS", nil
}

type MockLedger struct{}

func (m *MockLedger) RecordJournalEntry(ctx context.Context, paymentID uuid.UUID, providerID string, providerTxID string, amount, merchantCut, platformCut int64, currency, env string) (string, error) {
	return "SUCCESS", nil
}
func (m *MockLedger) RecordRefundJournalEntry(ctx context.Context, refundID, paymentID uuid.UUID, amount int64, currency, env string) (string, error) {
	return "SUCCESS", nil
}

type MockPricing struct{}

func (m *MockPricing) CalculateFee(ctx context.Context, merchantID uuid.UUID, paymentMethod string, amount int64, currency string) (*domain.PricingResponse, error) {
	return &domain.PricingResponse{TotalFee: 0, PlatformCut: 0, MerchantCut: amount}, nil
}

// Risk Mock where we can control the response
type MockRiskClient struct {
	action      string
	reason      string
	requires3ds bool
	err         error
}

func (m *MockRiskClient) CheckRisk(ctx context.Context, payment *domain.Payment) (string, string, bool, error) {
	return m.action, m.reason, m.requires3ds, m.err
}

// Tests

func TestOrchestrator_Phase22_3DS2_Challenge(t *testing.T) {
	repo := &MockPaymentRepo{}
	risk := &MockRiskClient{
		action:      "CHALLENGE", // Simulating ML trigger
		reason:      "High ML Risk Score",
		requires3ds: true,
		err:         nil,
	}

	orch := NewPaymentOrchestrator(repo, &MockMerchantClient{}, &MockCache{}, risk, &MockProvider{}, &MockLedger{}, &MockPricing{})

	req := &domain.PaymentRequest{
		APIKey:        "test-key",
		Amount:        50000, // 500.00
		Currency:      "ETB",
		PaymentMethod: "CARD",
	}

	res, err := orch.ProcessPayment(context.Background(), req, "hash")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if res.Status != domain.StateRequiresAction {
		t.Errorf("expected status %s, got %s", domain.StateRequiresAction, res.Status)
	}

	if res.CheckoutURL == "" {
		t.Error("expected CheckoutURL for 3DS2 challenge, got empty")
	}

	// Internal state should be updated
	if repo.payment.Status != domain.StateRequiresAction {
		t.Errorf("expected repo state %s, got %s", domain.StateRequiresAction, repo.payment.Status)
	}
}

func TestOrchestrator_Phase22_Risk_Block(t *testing.T) {
	repo := &MockPaymentRepo{}
	risk := &MockRiskClient{
		action:      "BLOCK",
		reason:      "Fraudulent IP",
		requires3ds: false,
		err:         nil,
	}

	orch := NewPaymentOrchestrator(repo, &MockMerchantClient{}, &MockCache{}, risk, &MockProvider{}, &MockLedger{}, &MockPricing{})

	req := &domain.PaymentRequest{
		APIKey:        "test-key",
		Amount:        50000,
		Currency:      "ETB",
		PaymentMethod: "CARD",
	}

	res, err := orch.ProcessPayment(context.Background(), req, "hash")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if res.Status != domain.StateFailed {
		t.Errorf("expected status %s, got %s", domain.StateFailed, res.Status)
	}

	if res.Reason != "Risk Block: Fraudulent IP" {
		t.Errorf("unexpected reason: %s", res.Reason)
	}
}

func TestOrchestrator_Phase22_Risk_Allow(t *testing.T) {
	repo := &MockPaymentRepo{}
	risk := &MockRiskClient{
		action:      "ALLOW",
		reason:      "Low Risk",
		requires3ds: false,
		err:         nil,
	}

	orch := NewPaymentOrchestrator(repo, &MockMerchantClient{}, &MockCache{}, risk, &MockProvider{}, &MockLedger{}, &MockPricing{})

	req := &domain.PaymentRequest{
		APIKey:        "test-key",
		Amount:        50000,
		Currency:      "ETB",
		PaymentMethod: "CARD",
	}

	res, err := orch.ProcessPayment(context.Background(), req, "hash")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if res.Status != domain.StateSucceeded {
		t.Errorf("expected status %s, got %s", domain.StateSucceeded, res.Status)
	}
}

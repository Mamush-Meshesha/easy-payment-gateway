package tests

import (
	"context"
	"errors"
	"payment-gateway/settlement-service/internal/domain"
	"payment-gateway/settlement-service/internal/service"
	"testing"

	"github.com/google/uuid"
)

// Mock Repo
type mockPayoutRepo struct {
	payouts map[uuid.UUID]*domain.Payout
}

func (m *mockPayoutRepo) CreatePayout(ctx context.Context, payout *domain.Payout) error {
	m.payouts[payout.ID] = payout
	return nil
}

func (m *mockPayoutRepo) GetPayoutByID(ctx context.Context, id uuid.UUID) (*domain.Payout, error) {
	return m.payouts[id], nil
}

func (m *mockPayoutRepo) GetPayoutByIdempotencyKey(ctx context.Context, merchantID uuid.UUID, idempotencyKey string) (*domain.Payout, error) {
	for _, p := range m.payouts {
		if p.MerchantID == merchantID && p.IdempotencyKey == idempotencyKey {
			return p, nil
		}
	}
	return nil, nil
}

func (m *mockPayoutRepo) UpdatePayoutState(ctx context.Context, id uuid.UUID, expectedState domain.PayoutState, newState domain.PayoutState, providerRef *string) error {
	p := m.payouts[id]
	if p.Status != expectedState {
		return errors.New("optimistic lock failure")
	}
	p.Status = newState
	if providerRef != nil {
		p.ProviderReference = *providerRef
	}
	return nil
}

// Mock Ledger
type mockLedger struct {
	reserveError  error
	releaseError  error
	completeError error

	reserved  bool
	released  bool
	completed bool
}

func (m *mockLedger) ReserveFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error {
	if m.reserveError != nil {
		return m.reserveError
	}
	m.reserved = true
	return nil
}

func (m *mockLedger) ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error {
	if m.releaseError != nil {
		return m.releaseError
	}
	m.released = true
	return nil
}

func (m *mockLedger) CompleteSettlement(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error {
	if m.completeError != nil {
		return m.completeError
	}
	m.completed = true
	return nil
}

// Mock Merchant
type mockMerchant struct{}

func (m *mockMerchant) GetPayoutDestination(ctx context.Context, merchantID uuid.UUID, currency string) (string, string, error) {
	return "1234567890", "TEST_BANK", nil
}

// Mock Provider
type mockProvider struct {
	result domain.PayoutResult
	err    error
}

func (m *mockProvider) InitiatePayout(ctx context.Context, req domain.PayoutRequest) (domain.PayoutResult, error) {
	return m.result, m.err
}

func (m *mockProvider) GetPayoutStatus(ctx context.Context, reference string) (domain.PayoutResult, error) {
	return m.result, m.err
}

func TestProcessSettlement_Success(t *testing.T) {
	repo := &mockPayoutRepo{payouts: make(map[uuid.UUID]*domain.Payout)}
	ledger := &mockLedger{}
	merchant := &mockMerchant{}
	provider := &mockProvider{
		result: domain.PayoutResult{Status: domain.ProviderStatusSuccess, ProviderReference: "ref-123"},
	}

	svc := service.NewSettlementService(repo, ledger, merchant, provider)

	merchantID := uuid.New()
	payout, err := svc.CreateSettlement(context.Background(), merchantID, "ETB", 1000, "idem-1")
	if err != nil {
		t.Fatal(err)
	}

	err = svc.ProcessSettlement(context.Background(), payout.ID)
	if err != nil {
		t.Fatal(err)
	}

	// Verify Status
	if payout.Status != domain.StateCompleted {
		t.Fatalf("expected COMPLETED, got %s", payout.Status)
	}
	if !ledger.reserved || !ledger.completed || ledger.released {
		t.Fatalf("invalid ledger state: res=%v comp=%v rel=%v", ledger.reserved, ledger.completed, ledger.released)
	}
}

func TestProcessSettlement_Timeout(t *testing.T) {
	repo := &mockPayoutRepo{payouts: make(map[uuid.UUID]*domain.Payout)}
	ledger := &mockLedger{}
	merchant := &mockMerchant{}

	// Timeout Scenario (Network Error)
	provider := &mockProvider{
		err: errors.New("i/o timeout"),
	}

	svc := service.NewSettlementService(repo, ledger, merchant, provider)

	merchantID := uuid.New()
	payout, _ := svc.CreateSettlement(context.Background(), merchantID, "ETB", 1000, "idem-2")

	err := svc.ProcessSettlement(context.Background(), payout.ID)
	if err == nil {
		t.Fatal("expected error on timeout")
	}

	// Strict Rule Check: MUST be UNKNOWN.
	if payout.Status != domain.StateUnknown {
		t.Fatalf("expected UNKNOWN on timeout, got %s", payout.Status)
	}
	// Strict Rule Check: MUST NOT be released!
	if ledger.released {
		t.Fatalf("Ledger funds were released on a timeout! This violates the rules.")
	}
}

func TestProcessSettlement_DefinitiveFailure(t *testing.T) {
	repo := &mockPayoutRepo{payouts: make(map[uuid.UUID]*domain.Payout)}
	ledger := &mockLedger{}
	merchant := &mockMerchant{}

	provider := &mockProvider{
		result: domain.PayoutResult{Status: domain.ProviderStatusFailed, ProviderReference: "ref-fail"},
	}

	svc := service.NewSettlementService(repo, ledger, merchant, provider)

	merchantID := uuid.New()
	payout, _ := svc.CreateSettlement(context.Background(), merchantID, "ETB", 1000, "idem-3")

	err := svc.ProcessSettlement(context.Background(), payout.ID)
	if err != nil {
		t.Fatal(err)
	}

	// Must be RELEASED, and Ledger must have been called to release
	if payout.Status != domain.StateReleased {
		t.Fatalf("expected RELEASED, got %s", payout.Status)
	}
	if !ledger.released {
		t.Fatalf("Ledger funds were not released on definitive failure!")
	}
}

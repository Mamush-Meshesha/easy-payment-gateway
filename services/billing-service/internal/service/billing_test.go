package service

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"payment-gateway/billing-service/internal/domain"
)

// Mock repository
type mockBillingRepo struct {
	dueSubs          []*domain.Subscription
	dueSubsErr       error
	createdInvs      []*domain.Invoice
	createInvErr     error
	subStatusUpdates map[uuid.UUID]domain.SubscriptionStatus
	invStatusUpdates map[uuid.UUID]domain.InvoiceStatus
	subPeriodUpdates []uuid.UUID
}

func (m *mockBillingRepo) CreatePlan(plan *domain.Plan) error                     { return nil }
func (m *mockBillingRepo) GetPlan(id uuid.UUID) (*domain.Plan, error)             { return nil, nil }
func (m *mockBillingRepo) ListPlans(merchantID uuid.UUID) ([]*domain.Plan, error) { return nil, nil }
func (m *mockBillingRepo) CreateSubscription(sub *domain.Subscription) error      { return nil }
func (m *mockBillingRepo) GetSubscription(id uuid.UUID) (*domain.Subscription, error) {
	return nil, nil
}
func (m *mockBillingRepo) UpdateSubscriptionStatus(id uuid.UUID, status domain.SubscriptionStatus) error {
	m.subStatusUpdates[id] = status
	return nil
}
func (m *mockBillingRepo) GetDueSubscriptions(currentTime time.Time) ([]*domain.Subscription, error) {
	return m.dueSubs, m.dueSubsErr
}
func (m *mockBillingRepo) UpdateSubscriptionPeriod(id uuid.UUID, newStart, newEnd time.Time) error {
	m.subPeriodUpdates = append(m.subPeriodUpdates, id)
	return nil
}
func (m *mockBillingRepo) CreateInvoice(invoice *domain.Invoice) error {
	if m.createInvErr != nil {
		return m.createInvErr
	}
	// Assign ID simulating DB auto-gen
	invoice.ID = uuid.New()
	m.createdInvs = append(m.createdInvs, invoice)
	return nil
}
func (m *mockBillingRepo) UpdateInvoiceStatus(id uuid.UUID, status domain.InvoiceStatus, paymentID *uuid.UUID) error {
	m.invStatusUpdates[id] = status
	return nil
}
func (m *mockBillingRepo) GetInvoiceByPaymentID(paymentID uuid.UUID) (*domain.Invoice, error) {
	return nil, nil
}

// Mock payment client
type mockPaymentClient struct {
	err error
	pid *uuid.UUID
}

func (m *mockPaymentClient) ExecutePayment(merchantID, paymentMethodID uuid.UUID, amount int64, currency string, idempotencyKey string) (*uuid.UUID, error) {
	return m.pid, m.err
}

func TestProcessDueSubscriptions(t *testing.T) {
	merchantID := uuid.New()
	subID := uuid.New()
	planID := uuid.New()
	paymentID := uuid.New()

	plan := domain.Plan{
		ID:       planID,
		Amount:   1000,
		Currency: "USD",
		Interval: "MONTHLY",
	}

	sub := &domain.Subscription{
		ID:               subID,
		MerchantID:       merchantID,
		CustomerID:       "cust_123",
		Plan:             plan,
		CurrentPeriodEnd: time.Now().Add(-1 * time.Hour), // Past due
	}

	t.Run("successful processing", func(t *testing.T) {
		repo := &mockBillingRepo{
			dueSubs:          []*domain.Subscription{sub},
			subStatusUpdates: make(map[uuid.UUID]domain.SubscriptionStatus),
			invStatusUpdates: make(map[uuid.UUID]domain.InvoiceStatus),
			subPeriodUpdates: make([]uuid.UUID, 0),
		}

		pc := &mockPaymentClient{
			pid: &paymentID,
			err: nil,
		}

		orchestrator := NewBillingOrchestrator(repo, pc)
		orchestrator.ProcessDueSubscriptions()

		if len(repo.createdInvs) != 1 {
			t.Fatalf("expected 1 invoice to be created, got %d", len(repo.createdInvs))
		}

		inv := repo.createdInvs[0]
		if inv.Amount != 1000 || inv.Currency != "USD" {
			t.Errorf("invoice amount or currency mismatch")
		}

		if repo.invStatusUpdates[inv.ID] != domain.InvoiceStatusOpen {
			t.Errorf("expected invoice to be OPEN")
		}

		if len(repo.subPeriodUpdates) != 1 || repo.subPeriodUpdates[0] != subID {
			t.Errorf("expected subscription period to be updated")
		}
	})

	t.Run("payment failure processing", func(t *testing.T) {
		repo := &mockBillingRepo{
			dueSubs:          []*domain.Subscription{sub},
			subStatusUpdates: make(map[uuid.UUID]domain.SubscriptionStatus),
			invStatusUpdates: make(map[uuid.UUID]domain.InvoiceStatus),
			subPeriodUpdates: make([]uuid.UUID, 0),
		}

		pc := &mockPaymentClient{
			err: errors.New("insufficient funds"),
		}

		orchestrator := NewBillingOrchestrator(repo, pc)
		orchestrator.ProcessDueSubscriptions()

		if len(repo.createdInvs) != 1 {
			t.Fatalf("expected 1 invoice to be created, got %d", len(repo.createdInvs))
		}

		if repo.subStatusUpdates[subID] != domain.SubscriptionStatusPastDue {
			t.Errorf("expected subscription status to be PAST_DUE on payment failure")
		}

		if len(repo.subPeriodUpdates) != 0 {
			t.Errorf("expected subscription period not to be updated on payment failure")
		}
	})
}

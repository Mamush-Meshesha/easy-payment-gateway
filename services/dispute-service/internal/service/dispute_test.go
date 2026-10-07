package service

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"payment-gateway/dispute-service/internal/domain"
)

type mockDisputeRepo struct {
	dispute         *domain.Dispute
	createdDisputes []*domain.Dispute
	createdEvidence []*domain.Evidence
	statusUpdates   map[uuid.UUID]domain.DisputeStatus
}

func (m *mockDisputeRepo) CreateDispute(dispute *domain.Dispute) error {
	dispute.ID = uuid.New()
	m.createdDisputes = append(m.createdDisputes, dispute)
	m.dispute = dispute
	return nil
}

func (m *mockDisputeRepo) GetDispute(id uuid.UUID) (*domain.Dispute, error) {
	if m.dispute != nil {
		return m.dispute, nil
	}
	return nil, errors.New("not found")
}

func (m *mockDisputeRepo) ListDisputes(merchantID uuid.UUID, limit, offset int) ([]*domain.Dispute, error) {
	return m.createdDisputes, nil
}

func (m *mockDisputeRepo) UpdateDisputeStatus(id uuid.UUID, status domain.DisputeStatus) error {
	m.statusUpdates[id] = status
	if m.dispute != nil {
		m.dispute.Status = status
	}
	return nil
}

func (m *mockDisputeRepo) AddEvidence(evidence *domain.Evidence) error {
	evidence.ID = uuid.New()
	m.createdEvidence = append(m.createdEvidence, evidence)
	return nil
}

func (m *mockDisputeRepo) ListEvidence(disputeID uuid.UUID) ([]*domain.Evidence, error) {
	return m.createdEvidence, nil
}

type mockLedgerClient struct {
	freezes  int
	releases int
	reverses int
}

func (m *mockLedgerClient) FreezeDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error {
	m.freezes++
	return nil
}

func (m *mockLedgerClient) ReleaseDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error {
	m.releases++
	return nil
}

func (m *mockLedgerClient) ReverseDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error {
	m.reverses++
	return nil
}

func TestDisputeOrchestrator(t *testing.T) {
	repo := &mockDisputeRepo{
		statusUpdates: make(map[uuid.UUID]domain.DisputeStatus),
	}
	ledger := &mockLedgerClient{}
	orch := NewDisputeOrchestrator(repo, ledger)

	merchantID := uuid.New()
	paymentID := uuid.New()

	t.Run("HandleIncomingDispute freezes funds", func(t *testing.T) {
		dispute, err := orch.HandleIncomingDispute(merchantID, paymentID, 5000, "USD", domain.DisputeReasonFraud)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if dispute.Status != domain.DisputeStatusNeedsResponse {
			t.Errorf("expected status to be NEEDS_RESPONSE")
		}

		if ledger.freezes != 1 {
			t.Errorf("expected 1 freeze call, got %d", ledger.freezes)
		}
	})

	t.Run("SubmitEvidence updates status", func(t *testing.T) {
		disputeID := repo.createdDisputes[0].ID
		_, err := orch.SubmitEvidence(disputeID, "proof.pdf", "s3://key", "application/pdf")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if repo.statusUpdates[disputeID] != domain.DisputeStatusUnderReview {
			t.Errorf("expected status to be updated to UNDER_REVIEW")
		}
	})

	t.Run("ResolveDispute Won releases funds", func(t *testing.T) {
		disputeID := repo.createdDisputes[0].ID
		err := orch.ResolveDispute(disputeID, true)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if repo.statusUpdates[disputeID] != domain.DisputeStatusWon {
			t.Errorf("expected status to be updated to WON")
		}

		if ledger.releases != 1 {
			t.Errorf("expected 1 release call, got %d", ledger.releases)
		}
	})
}

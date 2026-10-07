package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"payment-gateway/dispute-service/internal/domain"
)

type DisputeOrchestrator struct {
	repo         domain.DisputeRepository
	ledgerClient domain.LedgerClient
}

func NewDisputeOrchestrator(repo domain.DisputeRepository, ledgerClient domain.LedgerClient) *DisputeOrchestrator {
	return &DisputeOrchestrator{
		repo:         repo,
		ledgerClient: ledgerClient,
	}
}

func (o *DisputeOrchestrator) HandleIncomingDispute(merchantID, paymentID uuid.UUID, amount int64, currency string, reason domain.DisputeReason) (*domain.Dispute, error) {
	dispute := &domain.Dispute{
		ID:         uuid.Must(uuid.NewV7()),
		PaymentID:  paymentID,
		MerchantID: merchantID,
		Amount:     amount,
		Currency:   currency,
		Reason:     reason,
		Status:     domain.DisputeStatusNeedsResponse,
		DueBy:      time.Now().Add(7 * 24 * time.Hour), // Merchant has 7 days to respond
	}

	if err := o.repo.CreateDispute(dispute); err != nil {
		return nil, fmt.Errorf("failed to create dispute: %w", err)
	}

	// Freeze funds in ledger
	if err := o.ledgerClient.FreezeDisputeFunds(merchantID, paymentID, amount, currency); err != nil {
		// Log error, but dispute is already created. A background sync worker would retry ledger freeze.
		// For MVP, we'll return the error but acknowledge it.
		return dispute, fmt.Errorf("dispute created, but failed to freeze ledger funds: %w", err)
	}

	return dispute, nil
}

// SubmitEvidence transitions the dispute to UNDER_REVIEW
func (o *DisputeOrchestrator) SubmitEvidence(disputeID uuid.UUID, fileName, s3Key, mimeType string) (*domain.Evidence, error) {
	evidence := &domain.Evidence{
		ID:        uuid.Must(uuid.NewV7()),
		DisputeID: disputeID,
		FileName:  fileName,
		S3Key:     s3Key,
		MimeType:  mimeType,
	}

	if err := o.repo.AddEvidence(evidence); err != nil {
		return nil, fmt.Errorf("failed to add evidence: %w", err)
	}

	// Move status to under review
	if err := o.repo.UpdateDisputeStatus(disputeID, domain.DisputeStatusUnderReview); err != nil {
		return nil, fmt.Errorf("failed to update dispute status: %w", err)
	}

	return evidence, nil
}

// AcceptDispute means the merchant agrees with the chargeback, funds are immediately reversed.
func (o *DisputeOrchestrator) AcceptDispute(disputeID uuid.UUID) error {
	dispute, err := o.repo.GetDispute(disputeID)
	if err != nil {
		return err
	}

	if dispute.Status != domain.DisputeStatusNeedsResponse && dispute.Status != domain.DisputeStatusUnderReview {
		return fmt.Errorf("dispute cannot be accepted in state %s", dispute.Status)
	}

	if err := o.repo.UpdateDisputeStatus(disputeID, domain.DisputeStatusAccepted); err != nil {
		return err
	}

	// Reverse the frozen funds to the provider network
	if err := o.ledgerClient.ReverseDisputeFunds(dispute.MerchantID, dispute.PaymentID, dispute.Amount, dispute.Currency); err != nil {
		return fmt.Errorf("failed to reverse funds in ledger: %w", err)
	}

	return nil
}

// ResolveDispute is called (usually via webhook from Provider) when a dispute is won or lost.
func (o *DisputeOrchestrator) ResolveDispute(disputeID uuid.UUID, won bool) error {
	dispute, err := o.repo.GetDispute(disputeID)
	if err != nil {
		return err
	}

	if won {
		if err := o.repo.UpdateDisputeStatus(disputeID, domain.DisputeStatusWon); err != nil {
			return err
		}
		// Release funds back to merchant
		return o.ledgerClient.ReleaseDisputeFunds(dispute.MerchantID, dispute.PaymentID, dispute.Amount, dispute.Currency)
	} else {
		if err := o.repo.UpdateDisputeStatus(disputeID, domain.DisputeStatusLost); err != nil {
			return err
		}
		// Reverse funds to provider
		return o.ledgerClient.ReverseDisputeFunds(dispute.MerchantID, dispute.PaymentID, dispute.Amount, dispute.Currency)
	}
}

func (o *DisputeOrchestrator) GetDisputesByStatus(status domain.DisputeStatus) ([]*domain.Dispute, error) {
	return o.repo.GetDisputesByStatus(status)
}

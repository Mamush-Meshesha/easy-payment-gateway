package service

import (
	"context"
	"fmt"
	"payment-gateway/settlement-service/internal/domain"

	"github.com/google/uuid"
)

type SettlementService interface {
	CreateSettlement(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, idempotencyKey string) (*domain.Payout, error)
	ProcessSettlement(ctx context.Context, payoutID uuid.UUID) error
}

type SettlementServiceImpl struct {
	repo           domain.PayoutRepository
	ledgerClient   domain.LedgerClient
	merchantClient domain.MerchantClient
	provider       domain.PayoutProvider
}

func NewSettlementService(
	repo domain.PayoutRepository,
	ledger domain.LedgerClient,
	merchant domain.MerchantClient,
	provider domain.PayoutProvider,
) SettlementService {
	return &SettlementServiceImpl{
		repo:           repo,
		ledgerClient:   ledger,
		merchantClient: merchant,
		provider:       provider,
	}
}

// CreateSettlement handles the initial request to settle funds.
// This is typically called by the daily cron or an admin manual trigger.
func (s *SettlementServiceImpl) CreateSettlement(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, idempotencyKey string) (*domain.Payout, error) {
	// 1. Idempotency Check
	existing, err := s.repo.GetPayoutByIdempotencyKey(ctx, merchantID, idempotencyKey)
	if err != nil {
		return nil, fmt.Errorf("idempotency check failed: %w", err)
	}
	if existing != nil {
		return existing, nil
	}

	// 2. Validate Merchant Account Destination
	destAcc, destBank, err := s.merchantClient.GetPayoutDestination(ctx, merchantID, currency)
	if err != nil {
		return nil, fmt.Errorf("failed to get payout destination: %w", err)
	}
	if destAcc == "" || destBank == "" {
		return nil, fmt.Errorf("merchant %s has no valid payout destination for %s", merchantID, currency)
	}

	// 3. Create Payout Instruction
	payout := &domain.Payout{
		ID:                 uuid.New(),
		MerchantID:         merchantID,
		Currency:           currency,
		Amount:             amount,
		Status:             domain.StateCreated,
		IdempotencyKey:     idempotencyKey,
		DestinationToken:   destAcc,
		DestinationBank:    destBank,
	}

	if err := s.repo.CreatePayout(ctx, payout); err != nil {
		return nil, fmt.Errorf("failed to create payout record: %w", err)
	}

	return payout, nil
}

// ProcessSettlement orchestrates the reservation and payout flow safely.
// It ensures "No Silent Fallbacks" and respects Provider timeouts as UNKNOWN.
func (s *SettlementServiceImpl) ProcessSettlement(ctx context.Context, payoutID uuid.UUID) error {
	payout, err := s.repo.GetPayoutByID(ctx, payoutID)
	if err != nil {
		return fmt.Errorf("get payout: %w", err)
	}
	if payout == nil {
		return fmt.Errorf("payout %s not found", payoutID)
	}

	// State Machine execution
	switch payout.Status {
	case domain.StateCreated:
		return s.reserveFunds(ctx, payout)
	case domain.StateFundsReserved:
		return s.submitPayout(ctx, payout)
	case domain.StateCompleted, domain.StateFailed, domain.StateReleased:
		// Terminal states, do nothing
		return nil
	default:
		return fmt.Errorf("payout %s is in state %s which cannot be processed synchronously", payoutID, payout.Status)
	}
}

func (s *SettlementServiceImpl) reserveFunds(ctx context.Context, payout *domain.Payout) error {
	// Move to RESERVING
	if err := s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateCreated, domain.StateReserving, nil); err != nil {
		return err
	}

	// Call Ledger Service to atomically reserve
	err := s.ledgerClient.ReserveFunds(ctx, payout.MerchantID, payout.Currency, payout.Amount, payout.ID.String())
	if err != nil {
		// Ledger refused (e.g., insufficient funds, or RPC failed)
		// We fail the payout explicitly.
		if updateErr := s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateReserving, domain.StateFailed, nil); updateErr != nil {
			return fmt.Errorf("failed to fail payout after ledger error (%v): %w", err, updateErr)
		}
		return fmt.Errorf("ledger reservation failed: %w", err)
	}

	// Ledger success -> Update state
	if err := s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateReserving, domain.StateFundsReserved, nil); err != nil {
		return err // CRITICAL: The funds are reserved, but DB update failed. Idempotency on retry will see StateReserving and must reconcile.
	}

	// Continue to submit
	payout.Status = domain.StateFundsReserved
	return s.submitPayout(ctx, payout)
}

func (s *SettlementServiceImpl) submitPayout(ctx context.Context, payout *domain.Payout) error {
	// Move to SUBMITTING
	if err := s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateFundsReserved, domain.StateSubmitting, nil); err != nil {
		return err
	}

	// Call Provider
	req := domain.PayoutRequest{
		ReferenceID:        payout.ID.String(),
		Amount:             payout.Amount,
		Currency:           payout.Currency,
		DestinationToken:   payout.DestinationToken,
		DestinationBank:    payout.DestinationBank,
	}

	result, err := s.provider.InitiatePayout(ctx, req)
	if err != nil {
		// Strict Rule: A timeout or unknown error from the provider must result in UNKNOWN, NOT FAILED.
		// We do NOT release funds yet.
		s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateSubmitting, domain.StateUnknown, nil)
		return fmt.Errorf("provider initiation failed/timed out: %w", err)
	}

	switch result.Status {
	case domain.ProviderStatusSuccess:
		// Definitive Success
		s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateSubmitting, domain.StateCompleted, &result.ProviderReference)
		// Complete the settlement on the ledger
		s.ledgerClient.CompleteSettlement(ctx, payout.MerchantID, payout.Currency, payout.Amount, payout.ID.String())
		return nil

	case domain.ProviderStatusPending, domain.ProviderStatusUnknown:
		// Pending/Unknown
		s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateSubmitting, domain.StateProcessing, &result.ProviderReference)
		return nil

	case domain.ProviderStatusFailed:
		// Definitive Failure - ONLY here can we release funds
		if err := s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateSubmitting, domain.StateReleasing, &result.ProviderReference); err != nil {
			return err
		}

		// Release reserved funds
		releaseErr := s.ledgerClient.ReleaseReservedFunds(ctx, payout.MerchantID, payout.Currency, payout.Amount, payout.ID.String())
		if releaseErr != nil {
			return fmt.Errorf("failed to release ledger funds: %w", releaseErr)
		}

		s.repo.UpdatePayoutState(ctx, payout.ID, domain.StateReleasing, domain.StateReleased, nil)
		return nil
	}

	return nil
}

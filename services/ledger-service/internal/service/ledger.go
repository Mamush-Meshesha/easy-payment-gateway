package service

import (
	"context"
	"encoding/json"
	"time"
	"payment-gateway/ledger-service/internal/domain"

	"github.com/google/uuid"
)

type LedgerServiceImpl struct {
	repo domain.LedgerRepository
}

func NewLedgerService(repo domain.LedgerRepository) domain.LedgerService {
	return &LedgerServiceImpl{repo: repo}
}

func (s *LedgerServiceImpl) RecordTransaction(ctx context.Context, req *domain.RecordEntryRequest) (*domain.JournalEntry, error) {
	// First check idempotency at the service level (repo also checks it in a transaction to prevent race conditions)
	existing, err := s.repo.GetJournalEntryByReference(ctx, req.ReferenceType, req.ReferenceID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil // Idempotent return
	}

	entryID := uuid.New()
	
	lines := make([]domain.JournalLine, len(req.Lines))
	for i, lineReq := range req.Lines {
		lines[i] = domain.JournalLine{
			ID:             uuid.New(),
			JournalEntryID: entryID,
			AccountID:      lineReq.AccountID,
			Direction:      lineReq.Direction,
			Amount:         lineReq.Amount,
			CreatedAt:      time.Now(),
		}
	}

	entry := &domain.JournalEntry{
		ID:                    entryID,
		ReferenceType:         req.ReferenceType,
		ReferenceID:           req.ReferenceID,
		Currency:              req.Currency,
		Environment:           req.Environment,
		Lines:                 lines,
	}

	if req.ProviderID != nil {
		pid, err := uuid.Parse(*req.ProviderID)
		if err == nil {
			entry.ProviderID = &pid
		}
	}
	if req.ProviderTransactionID != nil {
		entry.ProviderTransactionID = req.ProviderTransactionID
	}

	payload, err := json.Marshal(entry)
	if err != nil {
		return nil, err
	}

	outboxEvent := &domain.OutboxEvent{
		EventID:       uuid.New(),
		EventType:     "ledger.journal.posted",
		AggregateType: "JournalEntry",
		AggregateID:   entryID.String(),
		Payload:       payload,
		Status:        domain.OutboxStatusPending,
	}

	if err := s.repo.RecordJournalEntry(ctx, entry, outboxEvent); err != nil {
		// If error is duplicate posting, try to fetch it again
		if err == domain.ErrDuplicatePosting {
			return s.repo.GetJournalEntryByReference(ctx, req.ReferenceType, req.ReferenceID)
		}
		return nil, err
	}

	return entry, nil
}

func (s *LedgerServiceImpl) GetAccountBalance(ctx context.Context, accountID string) (*domain.Account, error) {
	parsedID, err := uuid.Parse(accountID)
	if err != nil {
		return nil, err
	}
	return s.repo.GetAccountByID(ctx, parsedID)
}

func (s *LedgerServiceImpl) GetJournalEntry(ctx context.Context, refType, refID string) (*domain.JournalEntry, error) {
	return s.repo.GetJournalEntryByReference(ctx, refType, refID)
}

func (s *LedgerServiceImpl) GetJournalEntriesByProviderReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]domain.JournalEntry, error) {
	return s.repo.GetJournalEntriesByProviderReferences(ctx, providerID, providerTxIDs)
}

func (s *LedgerServiceImpl) ReserveFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, referenceID string) error {
	return s.repo.ReserveFunds(ctx, merchantID, environment, currency, amount, referenceID)
}

func (s *LedgerServiceImpl) ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error {
	return s.repo.ReleaseReservedFunds(ctx, merchantID, environment, currency, amount, originalReferenceID)
}

func (s *LedgerServiceImpl) CompleteSettlement(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error {
	return s.repo.CompleteSettlement(ctx, merchantID, environment, currency, amount, originalReferenceID)
}

func (s *LedgerServiceImpl) GetAccountsByMerchant(ctx context.Context, merchantID uuid.UUID, environment string, currency *string) ([]domain.Account, error) {
	return s.repo.GetAccountsByMerchant(ctx, merchantID, environment, currency)
}

func (s *LedgerServiceImpl) GetLedgerEntriesPaginated(ctx context.Context, merchantID uuid.UUID, environment string, currency *string, limit int, afterCursor *string) ([]domain.JournalEntry, error) {
	return s.repo.GetLedgerEntriesPaginated(ctx, merchantID, environment, currency, limit, afterCursor)
}

func (s *LedgerServiceImpl) FreezeAccounts(ctx context.Context, merchantID uuid.UUID) error {
	return s.repo.FreezeAccounts(ctx, merchantID)
}

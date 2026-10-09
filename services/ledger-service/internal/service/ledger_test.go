package service

import (
	"context"
	"payment-gateway/ledger-service/internal/domain"
	"testing"

	"github.com/google/uuid"
)

type mockLedgerRepository struct {
	entries map[string]*domain.JournalEntry
}

func (m *mockLedgerRepository) RecordJournalEntry(ctx context.Context, entry *domain.JournalEntry, outboxEvent *domain.OutboxEvent) error {
	key := entry.ReferenceType + "-" + entry.ReferenceID
	if _, exists := m.entries[key]; exists {
		return domain.ErrDuplicatePosting
	}
	m.entries[key] = entry
	return nil
}

func (m *mockLedgerRepository) GetJournalEntryByReference(ctx context.Context, refType, refID string) (*domain.JournalEntry, error) {
	key := refType + "-" + refID
	if entry, exists := m.entries[key]; exists {
		return entry, nil
	}
	return nil, nil
}

func (m *mockLedgerRepository) GetAccountByID(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
	return nil, domain.ErrAccountNotFound
}

func (m *mockLedgerRepository) GetJournalEntriesByProviderReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]domain.JournalEntry, error) {
	return nil, nil
}

func (m *mockLedgerRepository) ReserveFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error {
	return nil
}

func (m *mockLedgerRepository) ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, originalReferenceID string) error {
	return nil
}

func (m *mockLedgerRepository) CompleteSettlement(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, originalReferenceID string) error {
	return nil
}

func TestRecordTransaction_Idempotency(t *testing.T) {
	repo := &mockLedgerRepository{entries: make(map[string]*domain.JournalEntry)}
	svc := NewLedgerService(repo)

	req := &domain.RecordEntryRequest{
		ReferenceType: "PAYMENT",
		ReferenceID:   "txn-123",
		Currency:      "ETB",
		Lines: []domain.RecordLineRequest{
			{AccountID: uuid.New(), Direction: domain.DirectionDebit, Amount: 100},
			{AccountID: uuid.New(), Direction: domain.DirectionCredit, Amount: 100},
		},
	}

	// First call should succeed and create an entry
	entry1, err := svc.RecordTransaction(context.Background(), req)
	if err != nil {
		t.Fatalf("expected no error on first call, got %v", err)
	}

	// Second call with same reference should return the identical entry (Idempotency)
	entry2, err := svc.RecordTransaction(context.Background(), req)
	if err != nil {
		t.Fatalf("expected no error on second call, got %v", err)
	}

	if entry1.ID != entry2.ID {
		t.Errorf("expected idempotent return of same entry, got different IDs: %s vs %s", entry1.ID, entry2.ID)
	}
}

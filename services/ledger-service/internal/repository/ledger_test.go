package repository

import (
	"context"
	"os"
	"testing"
	"time"

	"payment-gateway/ledger-service/internal/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestRecordJournalEntry_Integration(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		// Fallback to local dev DB if not specified
		dsn = "host=localhost user=postgres password=postgres dbname=payment_gateway port=5433 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("Skipping integration test due to missing database connection: %v", err)
	}

	repo := NewLedgerRepository(db)

	ctx := context.Background()
	entryID := uuid.New()
	refID := "TEST-REF-" + entryID.String()

	entry := &domain.JournalEntry{
		ID:            entryID,
		ReferenceType: "PAYMENT",
		ReferenceID:   refID,
		Environment:   "LIVE",
		Currency:      "ETB",
		Lines: []domain.JournalLine{
			{
				ID:        uuid.New(),
				AccountID: uuid.MustParse("11111111-1111-1111-1111-111111111111"), // Mock Provider Receivable
				Direction: domain.DirectionDebit,
				Amount:    100,
				CreatedAt: time.Now(),
			},
			{
				ID:        uuid.New(),
				AccountID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), // Mock Merchant Payable
				Direction: domain.DirectionCredit,
				Amount:    100,
				CreatedAt: time.Now(),
			},
		},
	}

	// The bug was that RecordJournalEntry was failing due to GORM adding ON CONFLICT to journal_lines
	// because it didn't recognize CreatedAt as part of the composite primary key for the partitioned table.
	// Calling this function should now succeed.
	err = repo.RecordJournalEntry(ctx, entry, nil)
	assert.NoError(t, err, "RecordJournalEntry should succeed without ON CONFLICT errors")

	// Verify idempotency
	err = repo.RecordJournalEntry(ctx, entry, nil)
	assert.ErrorIs(t, err, domain.ErrDuplicatePosting, "Second call should return duplicate posting error")

	// Fetch to verify it exists
	savedEntry, err := repo.GetJournalEntryByReference(ctx, "PAYMENT", refID)
	assert.NoError(t, err)
	assert.NotNil(t, savedEntry)
	assert.Equal(t, entryID, savedEntry.ID)
	assert.Len(t, savedEntry.Lines, 2)
}

package repository

import (
	"context"
	"errors"
	"fmt"
	"payment-gateway/ledger-service/internal/domain"
	"sort"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LedgerRepositoryImpl struct {
	db *gorm.DB
}

func NewLedgerRepository(db *gorm.DB) domain.LedgerRepository {
	return &LedgerRepositoryImpl{db: db}
}

func (r *LedgerRepositoryImpl) GetAccountByID(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
	var account domain.Account
	if err := r.db.WithContext(ctx).First(&account, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

func (r *LedgerRepositoryImpl) GetJournalEntryByReference(ctx context.Context, refType, refID string) (*domain.JournalEntry, error) {
	var entry domain.JournalEntry
	if err := r.db.WithContext(ctx).Preload("Lines").First(&entry, "reference_type = ? AND reference_id = ?", refType, refID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil to indicate not found but no database error
		}
		return nil, err
	}
	return &entry, nil
}

// RecordJournalEntry implements the core accounting invariant transaction.
func (r *LedgerRepositoryImpl) RecordJournalEntry(ctx context.Context, entry *domain.JournalEntry, outboxEvent *domain.OutboxEvent) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Check Idempotency / Duplicate
		var count int64
		if err := tx.Model(&domain.JournalEntry{}).Where("reference_type = ? AND reference_id = ?", entry.ReferenceType, entry.ReferenceID).Count(&count).Error; err != nil {
			return fmt.Errorf("idempotency check failed: %w", err)
		}
		if count > 0 {
			return domain.ErrDuplicatePosting
		}

		// 2. Extract unique Account IDs and sort deterministically to prevent deadlocks
		accountIDMap := make(map[uuid.UUID]bool)
		for _, line := range entry.Lines {
			if line.Amount <= 0 {
				return domain.ErrInvalidAmount
			}
			accountIDMap[line.AccountID] = true
		}

		var accountIDs []string
		for id := range accountIDMap {
			accountIDs = append(accountIDs, id.String())
		}
		sort.Strings(accountIDs) // Deterministic ordering

		// 3. Lock Accounts for Update
		var accounts []domain.Account
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id IN ?", accountIDs).Order("id").Find(&accounts).Error; err != nil {
			return fmt.Errorf("failed to lock accounts: %w", err)
		}
		if len(accounts) != len(accountIDs) {
			return domain.ErrAccountNotFound
		}

		// Create a map for quick lookup
		lockedAccounts := make(map[uuid.UUID]*domain.Account)
		for i := range accounts {
			lockedAccounts[accounts[i].ID] = &accounts[i]
		}

		// 4. Validate accounts and calculate total Debits and Credits
		var totalDebit, totalCredit int64
		for _, line := range entry.Lines {
			acc := lockedAccounts[line.AccountID]
			if acc.Status != domain.AccountStatusActive {
				return domain.ErrAccountInactive
			}
			if acc.Currency != entry.Currency {
				return domain.ErrCurrencyMismatch
			}

			if line.Direction == domain.DirectionDebit {
				totalDebit += line.Amount
			} else if line.Direction == domain.DirectionCredit {
				totalCredit += line.Amount
			} else {
				return fmt.Errorf("invalid line direction: %s", line.Direction)
			}
		}

		if totalDebit != totalCredit {
			return domain.ErrUnbalancedEntry
		}
		if totalDebit == 0 {
			return domain.ErrMissingLines
		}

		// 5. Update Balances
		for _, line := range entry.Lines {
			acc := lockedAccounts[line.AccountID]

			// Account Balance Mathematics
			acc.ApplyJournalLine(line.Direction, line.Amount)

			if err := tx.Save(acc).Error; err != nil {
				return fmt.Errorf("failed to update account balance: %w", err)
			}
		}

		// 6. Insert Journal Entry and Lines
		if err := tx.Create(entry).Error; err != nil {
			return fmt.Errorf("failed to insert journal entry: %w", err)
		}

		// 7. Insert Outbox Event
		if outboxEvent != nil {
			if err := tx.Create(outboxEvent).Error; err != nil {
				return fmt.Errorf("failed to insert outbox event: %w", err)
			}
		}

		return nil
	})
}

func (r *LedgerRepositoryImpl) GetJournalEntriesByProviderReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]domain.JournalEntry, error) {
	var entries []domain.JournalEntry
	err := r.db.WithContext(ctx).
		Preload("Lines").
		Where("provider_id = ? AND provider_transaction_id IN ?", providerID, providerTxIDs).
		Find(&entries).Error
	return entries, err
}

func (r *LedgerRepositoryImpl) ReserveFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, referenceID string) error {
	return r.transferFunds(ctx, merchantID, environment, currency, amount, referenceID, "AVAILABLE", "PENDING_SETTLEMENT", "SETTLEMENT_RESERVE", true)
}

func (r *LedgerRepositoryImpl) ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error {
	return r.transferFunds(ctx, merchantID, environment, currency, amount, "release-"+originalReferenceID, "PENDING_SETTLEMENT", "AVAILABLE", "SETTLEMENT_RELEASE", false)
}

func (r *LedgerRepositoryImpl) CompleteSettlement(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, originalReferenceID string) error {
	return r.transferFunds(ctx, merchantID, environment, currency, amount, "complete-"+originalReferenceID, "PENDING_SETTLEMENT", "SETTLED", "SETTLEMENT_COMPLETE", false)
}

func (r *LedgerRepositoryImpl) transferFunds(ctx context.Context, merchantID uuid.UUID, environment string, currency string, amount int64, referenceID string, fromGroup string, toGroup string, refType string, checkBalance bool) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Idempotency
		var count int64
		if err := tx.Model(&domain.JournalEntry{}).Where("reference_type = ? AND reference_id = ?", refType, referenceID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return domain.ErrDuplicatePosting
		}

		// Get Accounts
		var accounts []domain.Account
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("owner_id = ? AND environment = ? AND currency = ? AND account_group IN ?", merchantID, environment, currency, []string{fromGroup, toGroup}).
			Find(&accounts).Error; err != nil {
			return err
		}

		if len(accounts) != 2 {
			return fmt.Errorf("missing required accounts for transfer. found %d", len(accounts))
		}

		var fromAcc, toAcc *domain.Account
		for i := range accounts {
			if accounts[i].AccountGroup == fromGroup {
				fromAcc = &accounts[i]
			} else if accounts[i].AccountGroup == toGroup {
				toAcc = &accounts[i]
			}
		}

		if fromAcc == nil || toAcc == nil {
			return fmt.Errorf("could not resolve from/to accounts")
		}

		// A merchant Available account is a LIABILITY to the platform.
		// To decrease it, we DEBIT it.
		// However, to keep this generic, if fromAcc is a liability, we debit it.
		if checkBalance && fromAcc.Balance < amount {
			return fmt.Errorf("insufficient funds in %s account", fromGroup)
		}

		entry := &domain.JournalEntry{
			ID:            uuid.New(),
			ReferenceType: refType,
			ReferenceID:   referenceID,
			Environment:   environment,
			Currency:      currency,
			Lines: []domain.JournalLine{
				{
					ID:        uuid.New(),
					AccountID: fromAcc.ID,
					Direction: domain.DirectionDebit, // Assuming Liability account (merchant balance)
					Amount:    amount,
				},
				{
					ID:        uuid.New(),
					AccountID: toAcc.ID,
					Direction: domain.DirectionCredit,
					Amount:    amount,
				},
			},
		}

		// Wait, if it's an asset we should credit to decrease.
		// The standard is Merchant Available = Liability.
		// Debit decreases Liability.
		fromAcc.ApplyJournalLine(domain.DirectionDebit, amount)
		toAcc.ApplyJournalLine(domain.DirectionCredit, amount)

		if err := tx.Save(fromAcc).Error; err != nil {
			return err
		}
		if err := tx.Save(toAcc).Error; err != nil {
			return err
		}

		return tx.Create(entry).Error
	})
}

func (r *LedgerRepositoryImpl) GetAccountsByMerchant(ctx context.Context, merchantID uuid.UUID, environment string, currency *string) ([]domain.Account, error) {
	var accounts []domain.Account
	query := r.db.WithContext(ctx)
	if merchantID != uuid.Nil {
		query = query.Where("owner_id = ?", merchantID)
	}
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}
	if currency != nil && *currency != "" {
		query = query.Where("currency = ?", *currency)
	}
	if err := query.Find(&accounts).Error; err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *LedgerRepositoryImpl) GetLedgerEntriesPaginated(ctx context.Context, merchantID uuid.UUID, environment string, currency *string, limit int, afterCursor *string) ([]domain.JournalEntry, error) {
	var entries []domain.JournalEntry

	// Create a subquery to find journal entries related to the merchant's accounts
	subQuery := r.db.Table("accounts").
		Select("journal_lines.journal_entry_id").
		Joins("JOIN journal_lines ON journal_lines.account_id = accounts.id")
	if merchantID != uuid.Nil {
		subQuery = subQuery.Where("accounts.owner_id = ?", merchantID)
	}

	query := r.db.WithContext(ctx).Preload("Lines").Where("id IN (?)", subQuery).Order("created_at DESC, id DESC").Limit(limit)
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}

	if currency != nil && *currency != "" {
		query = query.Where("currency = ?", *currency)
	}

	if afterCursor != nil && *afterCursor != "" {
		query = query.Where("id < ?", *afterCursor)
	}

	if err := query.Find(&entries).Error; err != nil {
		return nil, err
	}
	return entries, nil
}

func (r *LedgerRepositoryImpl) FreezeAccounts(ctx context.Context, merchantID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var accounts []domain.Account
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("owner_id = ?", merchantID).Find(&accounts).Error; err != nil {
			return err
		}

		for i := range accounts {
			accounts[i].Status = domain.AccountStatusFrozen
			if err := tx.Save(&accounts[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

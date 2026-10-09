package domain

import "testing"

func TestAccountApplyJournalLine(t *testing.T) {
	tests := []struct {
		name        string
		accountType AccountType
		initialBal  int64
		direction   JournalDirection
		amount      int64
		expectedBal int64
	}{
		// ASSET
		{"Asset Debit Increases", AccountTypeAsset, 100, DirectionDebit, 50, 150},
		{"Asset Credit Decreases", AccountTypeAsset, 100, DirectionCredit, 50, 50},

		// EXPENSE
		{"Expense Debit Increases", AccountTypeExpense, 100, DirectionDebit, 50, 150},
		{"Expense Credit Decreases", AccountTypeExpense, 100, DirectionCredit, 50, 50},

		// LIABILITY
		{"Liability Debit Decreases", AccountTypeLiability, 100, DirectionDebit, 50, 50},
		{"Liability Credit Increases", AccountTypeLiability, 100, DirectionCredit, 50, 150},

		// EQUITY
		{"Equity Debit Decreases", AccountTypeEquity, 100, DirectionDebit, 50, 50},
		{"Equity Credit Increases", AccountTypeEquity, 100, DirectionCredit, 50, 150},

		// REVENUE
		{"Revenue Debit Decreases", AccountTypeRevenue, 100, DirectionDebit, 50, 50},
		{"Revenue Credit Increases", AccountTypeRevenue, 100, DirectionCredit, 50, 150},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			acc := &Account{
				Type:    tt.accountType,
				Balance: tt.initialBal,
			}
			acc.ApplyJournalLine(tt.direction, tt.amount)
			if acc.Balance != tt.expectedBal {
				t.Errorf("Expected balance %d, got %d", tt.expectedBal, acc.Balance)
			}
		})
	}
}

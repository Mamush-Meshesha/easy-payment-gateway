package domain

import (
	"time"

	"github.com/google/uuid"
)

type AccountType string

const (
	AccountTypeAsset     AccountType = "ASSET"
	AccountTypeLiability AccountType = "LIABILITY"
	AccountTypeRevenue   AccountType = "REVENUE"
	AccountTypeExpense   AccountType = "EXPENSE"
	AccountTypeEquity    AccountType = "EQUITY"
)

type AccountStatus string

const (
	AccountStatusActive   AccountStatus = "ACTIVE"
	AccountStatusInactive AccountStatus = "INACTIVE"
	AccountStatusFrozen   AccountStatus = "FROZEN"
)

type Account struct {
	ID           uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey"`
	OwnerID      *uuid.UUID    `json:"ownerId" gorm:"type:uuid;index;uniqueIndex:idx_accounts_owner_group_currency_env,priority:1"`
	Environment  string        `json:"environment" gorm:"type:varchar(10);not null;default:'LIVE';uniqueIndex:idx_accounts_owner_group_currency_env,priority:2"`
	Name         string        `json:"name" gorm:"type:varchar(255);not null"`
	Type         AccountType   `json:"type" gorm:"type:varchar(20);not null"`
	AccountGroup string        `json:"accountGroup" gorm:"type:varchar(50);index;uniqueIndex:idx_accounts_owner_group_currency_env,priority:3"`
	Currency     string        `json:"currency" gorm:"type:varchar(3);not null;uniqueIndex:idx_accounts_owner_group_currency_env,priority:4"`
	Balance      int64         `json:"balance" gorm:"not null;default:0"`
	Status       AccountStatus `json:"status" gorm:"type:varchar(20);not null;default:'ACTIVE'"`
	CreatedAt    time.Time     `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time     `json:"updatedAt" gorm:"autoUpdateTime"`
}

func (a *Account) ApplyJournalLine(direction JournalDirection, amount int64) {
	if direction == DirectionDebit {
		switch a.Type {
		case AccountTypeAsset, AccountTypeExpense:
			a.Balance += amount
		case AccountTypeLiability, AccountTypeEquity, AccountTypeRevenue:
			a.Balance -= amount
		}
	} else if direction == DirectionCredit {
		switch a.Type {
		case AccountTypeAsset, AccountTypeExpense:
			a.Balance -= amount
		case AccountTypeLiability, AccountTypeEquity, AccountTypeRevenue:
			a.Balance += amount
		}
	}
}

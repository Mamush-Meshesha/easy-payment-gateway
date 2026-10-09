package domain

import "errors"

var (
	ErrAccountNotFound       = errors.New("account not found")
	ErrAccountInactive       = errors.New("account is inactive")
	ErrCurrencyMismatch      = errors.New("currency mismatch between entry and account")
	ErrUnbalancedEntry       = errors.New("journal entry debits must equal credits")
	ErrInvalidAmount         = errors.New("amount must be greater than zero")
	ErrMissingLines          = errors.New("journal entry must have at least one debit and one credit")
	ErrDuplicatePosting      = errors.New("journal entry with this reference already exists")
)

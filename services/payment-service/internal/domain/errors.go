package domain

import "errors"

var (
	ErrPaymentNotFound      = errors.New("payment not found")
	// ErrIdempotentHit: the idempotency key already exists with an IDENTICAL payload — return existing payment.
	ErrIdempotentHit        = errors.New("idempotency key already processed with same payload")
	// ErrIdempotencyMismatch: the idempotency key already exists but with a DIFFERENT payload — reject with 409.
	ErrIdempotencyMismatch  = errors.New("idempotency key mismatch with different payload")
	ErrInvalidState         = errors.New("invalid payment state transition")
	ErrOptimisticLockFailed = errors.New("optimistic lock failed")
	ErrRiskBlocked          = errors.New("payment blocked by risk evaluation")
	ErrProviderFailed       = errors.New("provider rejected the payment")
	ErrUnknownState         = errors.New("payment is in an unknown state")
)

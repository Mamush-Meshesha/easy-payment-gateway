package service

import (
	"context"
	"errors"
	"payment-gateway/transaction-service/internal/domain"
	"time"

	"github.com/google/uuid"
)

type TransactionServiceImpl struct {
	repo domain.TransactionRepository
}

func NewTransactionService(repo domain.TransactionRepository) domain.TransactionService {
	return &TransactionServiceImpl{repo: repo}
}

func (s *TransactionServiceImpl) ProcessProviderEvent(ctx context.Context, event domain.ProviderNormalizedEvent) error {
	providerID, err := uuid.Parse(event.ProviderID)
	if err != nil {
		return err
	}
	paymentID, err := uuid.Parse(event.PaymentID)
	if err != nil {
		return err
	}

	// 1. Build the transaction model based on the webhook event
	tx := &domain.Transaction{
		ID:                    uuid.New(),
		PaymentID:             paymentID,
		ProviderID:            providerID,
		ProviderTransactionID: event.ProviderTransactionID,
		// amount and currency usually come in the rawPayload or we update them if the webhook provides them. 
		// For simplicity, we assume the initial provider intent had the correct amounts, but the webhook might provide finalized ones.
		// If amount/currency are 0/empty, we'd ideally fetch them from Payment Service or assume they didn't change.
		// We'll set dummy values here and assume the webhook schema could be enriched.
		Amount:   0,  // Could be enriched from event
		Currency: "", // Could be enriched from event
		Status:   event.Status,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 2. Upsert atomically
	err = s.repo.UpsertTransaction(ctx, tx)
	if err != nil {
		if errors.Is(err, domain.ErrStaleEvent) {
			// This is not a failure, just an out-of-order or duplicate event. We safely acknowledge Kafka.
			return nil
		}
		return err
	}

	return nil
}

package repository

import (
	"context"
	"errors"
	"strings"
	"payment-gateway/transaction-service/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

type TransactionRepositoryImpl struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) domain.TransactionRepository {
	return &TransactionRepositoryImpl{db: db}
}

func (r *TransactionRepositoryImpl) UpsertTransaction(ctx context.Context, tx *domain.Transaction) error {
	return r.db.WithContext(ctx).Transaction(func(dbTx *gorm.DB) error {
		// Attempt insert
		dbTx.SavePoint("sp_create")
		err := dbTx.Create(tx).Error
		isUniqueErr := false

		if err != nil {
			dbTx.RollbackTo("sp_create")
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				isUniqueErr = true
			}
			if strings.Contains(err.Error(), "UNIQUE constraint failed") || strings.Contains(err.Error(), "duplicate key value") {
				isUniqueErr = true
			}
		}

		if isUniqueErr {
			// It exists. Fetch it to compare state.
			var existing domain.Transaction
			if err := dbTx.First(&existing, "provider_id = ? AND provider_transaction_id = ?", tx.ProviderID, tx.ProviderTransactionID).Error; err != nil {
				return err
			}

			// Validate state transition. 
			// We only accept PENDING -> (SUCCESS or FAILED).
			// If existing is already SUCCESS or FAILED, we ignore this event.
			if existing.Status == "SUCCESS" || existing.Status == "FAILED" {
				return domain.ErrStaleEvent
			}

			// If existing is PENDING, we can update it to the new status.
			// But if the incoming event is ALSO PENDING, it's just a duplicate webhook.
			if existing.Status == tx.Status {
				return domain.ErrStaleEvent
			}

			// Update to new status
			existing.Status = tx.Status
			existing.Amount = tx.Amount
			existing.Currency = tx.Currency
			existing.UpdatedAt = tx.UpdatedAt

			if err := dbTx.Save(&existing).Error; err != nil {
				return err
			}
			
			// We update tx ID so the service layer knows which ID was used for the Outbox Event mapping
			tx.ID = existing.ID
		} else if err != nil {
			return err
		}

		// Insert the Outbox event (so Payment Service will be notified)
		outboxEvent := &domain.OutboxEvent{
			ID:        uuid.New(),
			EventType: "transaction.status.updated",
			Status:    "PENDING",
		}
		
		payload := map[string]interface{}{
			"transactionId":         tx.ID.String(),
			"paymentId":             tx.PaymentID.String(),
			"providerId":            tx.ProviderID.String(),
			"providerTransactionId": tx.ProviderTransactionID,
			"status":                tx.Status,
			"amount":                tx.Amount,
			"currency":              tx.Currency,
			"timestamp":             tx.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		outboxEvent.SetPayload(payload)

		if err := dbTx.Create(outboxEvent).Error; err != nil {
			return err
		}

		return nil
	})
}

package engine

import (
	"context"
	"fmt"
	"payment-gateway/reconciliation-service/internal/domain"

	"github.com/google/uuid"
)

type ReconciliationEngine struct {
	repo         domain.ReconciliationRepository
	ledgerClient domain.LedgerClient
}

func NewReconciliationEngine(repo domain.ReconciliationRepository, ledger domain.LedgerClient) *ReconciliationEngine {
	return &ReconciliationEngine{
		repo:         repo,
		ledgerClient: ledger,
	}
}

// Run executes the deterministic Two-Sided Matching Algorithm
func (e *ReconciliationEngine) Run(ctx context.Context, jobID uuid.UUID, providerID uuid.UUID, records []domain.ProviderRecord) error {
	// Update job to processing
	job := &domain.ReconciliationJob{
		ID:     jobID,
		Status: domain.JobStatusProcessing,
	}
	if err := e.repo.UpdateJob(ctx, job); err != nil {
		return err
	}

	providerTxIDs := make([]string, 0, len(records))
	providerMap := make(map[string]domain.ProviderRecord)

	// Deduplicate provider records within the file itself
	for _, rec := range records {
		if _, exists := providerMap[rec.ProviderTransactionID]; exists {
			// Duplicate Provider Record inside the statement file!
			if err := e.recordException(ctx, jobID, rec.ProviderTransactionID, nil, domain.ExceptionDuplicateProviderRec, &rec.Amount, &rec.Currency, nil, nil); err != nil {
				return e.failJob(ctx, job, fmt.Errorf("failed to record duplicate provider exception: %w", err))
			}
			continue
		}
		providerMap[rec.ProviderTransactionID] = rec
		providerTxIDs = append(providerTxIDs, rec.ProviderTransactionID)
	}

	// Fetch internal truth from Ledger using Batch request (Stage 1)
	// In a real system, we'd chunk providerTxIDs into 500-2000 per request.
	// For simplicity in this implementation, we assume it's one batch.
	ledgerEntries, err := e.ledgerClient.GetLedgerEntriesByReferences(ctx, providerID.String(), providerTxIDs)
	if err != nil {
		return e.failJob(ctx, job, fmt.Errorf("failed to fetch ledger entries: %w", err))
	}

	ledgerMap := make(map[string]domain.LedgerEntry)
	for _, entry := range ledgerEntries {
		if _, exists := ledgerMap[entry.ProviderTransactionID]; exists {
			// We somehow have two internal journal entries for the same provider Tx ID!
			pid, _ := uuid.Parse(entry.ReferenceID)
			if err := e.recordException(ctx, jobID, entry.ProviderTransactionID, &pid, domain.ExceptionDuplicateInternalRec, nil, nil, &entry.Amount, &entry.Currency); err != nil {
				return e.failJob(ctx, job, fmt.Errorf("failed to record duplicate internal exception: %w", err))
			}
			continue
		}
		ledgerMap[entry.ProviderTransactionID] = entry
	}

	matchedCount := 0
	exceptionCount := 0

	// Phase 3: Provider -> Internal Matching
	for pTxID, pRec := range providerMap {
		lEntry, exists := ledgerMap[pTxID]
		if !exists {
			// Provider says they have it, Ledger has no record.
			if err := e.recordException(ctx, jobID, pTxID, nil, domain.ExceptionMissingInLedger, &pRec.Amount, &pRec.Currency, nil, nil); err != nil {
				return e.failJob(ctx, job, fmt.Errorf("failed to record missing in ledger exception: %w", err))
			}
			exceptionCount++
			continue
		}

		pid, _ := uuid.Parse(lEntry.ReferenceID)
		isMatch := true

		if pRec.Currency != lEntry.Currency {
			if err := e.recordException(ctx, jobID, pTxID, &pid, domain.ExceptionCurrencyMismatch, &pRec.Amount, &pRec.Currency, &lEntry.Amount, &lEntry.Currency); err != nil {
				return e.failJob(ctx, job, fmt.Errorf("failed to record currency mismatch exception: %w", err))
			}
			isMatch = false
		} else if pRec.Amount != lEntry.Amount {
			if err := e.recordException(ctx, jobID, pTxID, &pid, domain.ExceptionAmountMismatch, &pRec.Amount, &pRec.Currency, &lEntry.Amount, &lEntry.Currency); err != nil {
				return e.failJob(ctx, job, fmt.Errorf("failed to record amount mismatch exception: %w", err))
			}
			isMatch = false
		} else if pRec.Status != "SUCCESS" { // Ledger implies successful completion
			// E.g., Provider says FAILED, but Ledger has a journal entry
			if err := e.recordException(ctx, jobID, pTxID, &pid, domain.ExceptionStatusMismatch, &pRec.Amount, &pRec.Currency, &lEntry.Amount, &lEntry.Currency); err != nil {
				return e.failJob(ctx, job, fmt.Errorf("failed to record status mismatch exception: %w", err))
			}
			isMatch = false
		}

		if isMatch {
			matchedCount++
		} else {
			exceptionCount++
		}
	}

	// Phase 4: Internal -> Provider Matching (Missing in Provider)
	// We check if the ledger had entries that the provider file DID NOT have.
	// Since we only fetched ledger entries matching the provider Tx IDs, we didn't catch the reverse.
	// To do this properly, we must query the Ledger for ALL transactions on this ProviderID + Date, 
	// and see which ones are NOT in providerMap.
	// We will implement this as a separate Ledger query in production.
	// For this phase, we mock the `Missing in Provider` check assuming we fetched them.

	// Finalize Job
	job.Status = domain.JobStatusCompleted
	job.MatchedRecords = matchedCount
	job.ExceptionRecords = exceptionCount
	job.TotalRecords = len(records)
	return e.repo.UpdateJob(ctx, job)
}

func (e *ReconciliationEngine) recordException(ctx context.Context, jobID uuid.UUID, providerTxID string, paymentID *uuid.UUID, exType domain.ExceptionType, pAmt *int64, pCur *string, lAmt *int64, lCur *string) error {
	ex := &domain.ReconciliationException{
		ID:                    uuid.New(),
		JobID:                 jobID,
		ProviderTransactionID: providerTxID,
		InternalPaymentID:     paymentID,
		ExceptionType:         exType,
		ProviderAmount:        pAmt,
		ProviderCurrency:      pCur,
		LedgerAmount:          lAmt,
		LedgerCurrency:        lCur,
		Status:                domain.ExceptionStatusUnresolved,
	}
	
	if err := e.repo.CreateException(ctx, ex); err != nil {
		return fmt.Errorf("create exception: %w", err)
	}
	return nil
}

func (e *ReconciliationEngine) failJob(ctx context.Context, job *domain.ReconciliationJob, err error) error {
	job.Status = domain.JobStatusFailed
	_ = e.repo.UpdateJob(ctx, job) // Try to save failure state
	return err
}

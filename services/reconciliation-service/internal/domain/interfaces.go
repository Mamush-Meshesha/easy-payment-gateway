package domain

import (
	"context"
	"io"
)

type ReconciliationRepository interface {
	CreateStatement(ctx context.Context, statement *ReconciliationStatement) error
	CreateJob(ctx context.Context, job *ReconciliationJob) error
	UpdateJob(ctx context.Context, job *ReconciliationJob) error
	CreateException(ctx context.Context, exception *ReconciliationException) error
	CreateExceptionAction(ctx context.Context, action *ReconciliationExceptionAction) error
	UpdateExceptionStatus(ctx context.Context, exceptionID string, status ExceptionStatus) error
	GetJobs(ctx context.Context, limit, offset int) ([]ReconciliationJob, error)
	GetExceptions(ctx context.Context, jobID string, limit, offset int) ([]ReconciliationException, error)
}

type StatementSource interface {
	Parse(ctx context.Context, reader io.Reader) ([]ProviderRecord, error)
}

type ReconciliationService interface {
	ProcessStatement(ctx context.Context, providerID string, fileName string, fileHash string, reader io.Reader) (string, error)
	ResolveException(ctx context.Context, exceptionID string, resolvedBy string, reason string, reference string) error
	GetJobs(ctx context.Context, limit, offset int) ([]ReconciliationJob, error)
	GetExceptions(ctx context.Context, jobID string, limit, offset int) ([]ReconciliationException, error)
}

// LedgerClient is used by the Engine to fetch exact JournalEntries
type LedgerClient interface {
	GetLedgerEntriesByReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]LedgerEntry, error)
}

type LedgerEntry struct {
	JournalEntryID        string
	ReferenceType         string
	ReferenceID           string
	ProviderID            string
	ProviderTransactionID string
	Amount                int64
	Currency              string
	EffectiveAt           string
}

package tests

import (
	"context"
	"payment-gateway/reconciliation-service/internal/domain"
	"payment-gateway/reconciliation-service/internal/engine"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRepo
type mockRepo struct {
	mock.Mock
}

func (m *mockRepo) CreateStatement(ctx context.Context, statement *domain.ReconciliationStatement) error {
	return m.Called(ctx, statement).Error(0)
}
func (m *mockRepo) CreateJob(ctx context.Context, job *domain.ReconciliationJob) error {
	return m.Called(ctx, job).Error(0)
}
func (m *mockRepo) UpdateJob(ctx context.Context, job *domain.ReconciliationJob) error {
	return m.Called(ctx, job).Error(0)
}
func (m *mockRepo) CreateException(ctx context.Context, exception *domain.ReconciliationException) error {
	return m.Called(ctx, exception).Error(0)
}
func (m *mockRepo) CreateExceptionAction(ctx context.Context, action *domain.ReconciliationExceptionAction) error {
	return m.Called(ctx, action).Error(0)
}
func (m *mockRepo) UpdateExceptionStatus(ctx context.Context, exceptionID string, status domain.ExceptionStatus) error {
	return m.Called(ctx, exceptionID, status).Error(0)
}

// MockLedger
type mockLedger struct {
	mock.Mock
}

func (m *mockLedger) GetLedgerEntriesByReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]domain.LedgerEntry, error) {
	args := m.Called(ctx, providerID, providerTxIDs)
	return args.Get(0).([]domain.LedgerEntry), args.Error(1)
}

func TestReconciliationEngine_MatchingLogic(t *testing.T) {
	providerID := uuid.New()
	jobID := uuid.New()

	records := []domain.ProviderRecord{
		{ProviderTransactionID: "txn-1", Amount: 100, Currency: "ETB", Status: "SUCCESS"}, // Match
		{ProviderTransactionID: "txn-2", Amount: 200, Currency: "ETB", Status: "SUCCESS"}, // Amount Mismatch
		{ProviderTransactionID: "txn-3", Amount: 300, Currency: "USD", Status: "SUCCESS"}, // Currency Mismatch
		{ProviderTransactionID: "txn-4", Amount: 400, Currency: "ETB", Status: "FAILED"},  // Status Mismatch
		{ProviderTransactionID: "txn-5", Amount: 500, Currency: "ETB", Status: "SUCCESS"}, // Missing in Ledger
		{ProviderTransactionID: "txn-1", Amount: 100, Currency: "ETB", Status: "SUCCESS"}, // Duplicate Provider Record
	}

	ledgerEntries := []domain.LedgerEntry{
		{ProviderTransactionID: "txn-1", Amount: 100, Currency: "ETB"},
		{ProviderTransactionID: "txn-2", Amount: 150, Currency: "ETB"},
		{ProviderTransactionID: "txn-3", Amount: 300, Currency: "ETB"},
		{ProviderTransactionID: "txn-4", Amount: 400, Currency: "ETB"},
	}

	repo := new(mockRepo)
	ledger := new(mockLedger)
	eng := engine.NewReconciliationEngine(repo, ledger)

	// Expectations
	repo.On("UpdateJob", mock.Anything, mock.AnythingOfType("*domain.ReconciliationJob")).Return(nil)

	// Expectations for Exceptions
	repo.On("CreateException", mock.Anything, mock.MatchedBy(func(e *domain.ReconciliationException) bool {
		return e.ExceptionType == domain.ExceptionDuplicateProviderRec
	})).Return(nil).Once()

	repo.On("CreateException", mock.Anything, mock.MatchedBy(func(e *domain.ReconciliationException) bool {
		return e.ExceptionType == domain.ExceptionAmountMismatch
	})).Return(nil).Once()

	repo.On("CreateException", mock.Anything, mock.MatchedBy(func(e *domain.ReconciliationException) bool {
		return e.ExceptionType == domain.ExceptionCurrencyMismatch
	})).Return(nil).Once()

	repo.On("CreateException", mock.Anything, mock.MatchedBy(func(e *domain.ReconciliationException) bool {
		return e.ExceptionType == domain.ExceptionStatusMismatch
	})).Return(nil).Once()

	repo.On("CreateException", mock.Anything, mock.MatchedBy(func(e *domain.ReconciliationException) bool {
		return e.ExceptionType == domain.ExceptionMissingInLedger
	})).Return(nil).Once()

	ledger.On("GetLedgerEntriesByReferences", mock.Anything, providerID.String(), mock.Anything).Return(ledgerEntries, nil)

	// Execute
	err := eng.Run(context.Background(), jobID, providerID, records)
	assert.NoError(t, err)

	repo.AssertExpectations(t)
	ledger.AssertExpectations(t)
}

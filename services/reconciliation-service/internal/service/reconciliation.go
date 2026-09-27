package service

import (
	"context"
	"fmt"
	"io"
	"payment-gateway/reconciliation-service/internal/domain"
	"payment-gateway/reconciliation-service/internal/engine"
	"time"

	"github.com/google/uuid"
)

type ReconciliationServiceImpl struct {
	repo   domain.ReconciliationRepository
	source domain.StatementSource
	engine *engine.ReconciliationEngine
}

func NewReconciliationService(repo domain.ReconciliationRepository, source domain.StatementSource, eng *engine.ReconciliationEngine) domain.ReconciliationService {
	return &ReconciliationServiceImpl{
		repo:   repo,
		source: source,
		engine: eng,
	}
}

func (s *ReconciliationServiceImpl) ProcessStatement(ctx context.Context, providerIDStr string, fileName string, fileHash string, reader io.Reader) (string, error) {
	providerID, err := uuid.Parse(providerIDStr)
	if err != nil {
		return "", fmt.Errorf("invalid provider ID: %w", err)
	}

	// 1. Parse CSV synchronously to ensure it's well-formed before creating the job
	records, err := s.source.Parse(ctx, reader)
	if err != nil {
		return "", err
	}

	// 2. Create Statement (this guarantees duplicate prevention via fileHash UNIQUE constraint)
	stmt := &domain.ReconciliationStatement{
		ID:            uuid.New(),
		ProviderID:    providerID,
		StatementDate: time.Now().Truncate(24 * time.Hour), // Ideally parsed from file or API req
		FileName:      fileName,
		FileHash:      fileHash,
		RecordCount:   len(records),
	}
	
	if err := s.repo.CreateStatement(ctx, stmt); err != nil {
		return "", err
	}

	// 3. Create Job
	job := &domain.ReconciliationJob{
		ID:           uuid.New(),
		StatementID:  stmt.ID,
		Status:       domain.JobStatusPending,
		TotalRecords: len(records),
	}
	
	if err := s.repo.CreateJob(ctx, job); err != nil {
		return "", err
	}

	// 4. Trigger Background Engine
	// We run this in a goroutine because parsing/uploading is synchronous, but matching is async.
	go func() {
		// Use a new background context because the HTTP request context will be cancelled when the response is sent.
		bgCtx := context.Background()
		if err := s.engine.Run(bgCtx, job.ID, providerID, records); err != nil {
			fmt.Printf("Engine Failed: %v\n", err)
		}
	}()

	return job.ID.String(), nil
}

func (s *ReconciliationServiceImpl) ResolveException(ctx context.Context, exceptionID string, resolvedBy string, reason string, reference string) error {
	// 1. Validate Exception ID
	eid, err := uuid.Parse(exceptionID)
	if err != nil {
		return err
	}

	// 2. Create Action Log
	action := &domain.ReconciliationExceptionAction{
		ID:                  uuid.New(),
		ExceptionID:         eid,
		Action:              domain.ActionResolved,
		ResolvedBy:          resolvedBy,
		ResolutionReason:    reason,
		ResolutionReference: reference,
	}

	if err := s.repo.CreateExceptionAction(ctx, action); err != nil {
		return err
	}

	// 3. Update Status
	return s.repo.UpdateExceptionStatus(ctx, exceptionID, domain.ExceptionStatusResolved)
}

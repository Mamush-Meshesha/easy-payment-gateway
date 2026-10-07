package repository

import (
	"context"
	"errors"
	"payment-gateway/reconciliation-service/internal/domain"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

type ReconciliationRepositoryImpl struct {
	db *gorm.DB
}

func NewReconciliationRepository(db *gorm.DB) domain.ReconciliationRepository {
	return &ReconciliationRepositoryImpl{db: db}
}

func (r *ReconciliationRepositoryImpl) CreateStatement(ctx context.Context, statement *domain.ReconciliationStatement) error {
	err := r.db.WithContext(ctx).Create(statement).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // Unique violation
			return domain.ErrDuplicateStatement
		}
		return err
	}
	return nil
}

func (r *ReconciliationRepositoryImpl) CreateJob(ctx context.Context, job *domain.ReconciliationJob) error {
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *ReconciliationRepositoryImpl) UpdateJob(ctx context.Context, job *domain.ReconciliationJob) error {
	return r.db.WithContext(ctx).Save(job).Error
}

func (r *ReconciliationRepositoryImpl) CreateException(ctx context.Context, exception *domain.ReconciliationException) error {
	return r.db.WithContext(ctx).Create(exception).Error
}

func (r *ReconciliationRepositoryImpl) CreateExceptionAction(ctx context.Context, action *domain.ReconciliationExceptionAction) error {
	return r.db.WithContext(ctx).Create(action).Error
}

func (r *ReconciliationRepositoryImpl) UpdateExceptionStatus(ctx context.Context, exceptionID string, status domain.ExceptionStatus) error {
	return r.db.WithContext(ctx).Model(&domain.ReconciliationException{}).Where("id = ?", exceptionID).Update("status", status).Error
}

func (r *ReconciliationRepositoryImpl) GetJobs(ctx context.Context, limit, offset int) ([]domain.ReconciliationJob, error) {
	var jobs []domain.ReconciliationJob
	err := r.db.WithContext(ctx).Order("created_at desc").Limit(limit).Offset(offset).Find(&jobs).Error
	return jobs, err
}

func (r *ReconciliationRepositoryImpl) GetExceptions(ctx context.Context, jobID string, limit, offset int) ([]domain.ReconciliationException, error) {
	var exceptions []domain.ReconciliationException
	err := r.db.WithContext(ctx).Where("job_id = ?", jobID).Order("created_at desc").Limit(limit).Offset(offset).Find(&exceptions).Error
	return exceptions, err
}

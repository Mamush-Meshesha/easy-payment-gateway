package repository

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"payment-gateway/dispute-service/internal/domain"
)

type DisputeRepositoryImpl struct {
	db *gorm.DB
}

func NewDisputeRepository(db *gorm.DB) domain.DisputeRepository {
	return &DisputeRepositoryImpl{db: db}
}

func (r *DisputeRepositoryImpl) CreateDispute(dispute *domain.Dispute) error {
	return r.db.Create(dispute).Error
}

func (r *DisputeRepositoryImpl) GetDispute(id uuid.UUID) (*domain.Dispute, error) {
	var d domain.Dispute
	if err := r.db.First(&d, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("dispute not found")
		}
		return nil, err
	}
	return &d, nil
}

func (r *DisputeRepositoryImpl) ListDisputes(merchantID uuid.UUID, limit, offset int) ([]*domain.Dispute, error) {
	var disputes []*domain.Dispute
	query := r.db
	if merchantID != uuid.Nil {
		query = query.Where("merchant_id = ?", merchantID)
	}
	err := query.
		Limit(limit).Offset(offset).
		Order("created_at desc").
		Find(&disputes).Error
	return disputes, err
}

func (r *DisputeRepositoryImpl) UpdateDisputeStatus(id uuid.UUID, status domain.DisputeStatus) error {
	return r.db.Model(&domain.Dispute{}).Where("id = ?", id).Update("status", status).Error
}

func (r *DisputeRepositoryImpl) AddEvidence(evidence *domain.Evidence) error {
	return r.db.Create(evidence).Error
}

func (r *DisputeRepositoryImpl) ListEvidence(disputeID uuid.UUID) ([]*domain.Evidence, error) {
	var evs []*domain.Evidence
	err := r.db.Where("dispute_id = ?", disputeID).Order("created_at asc").Find(&evs).Error
	return evs, err
}

func (r *DisputeRepositoryImpl) GetDisputesByStatus(status domain.DisputeStatus) ([]*domain.Dispute, error) {
	var disputes []*domain.Dispute
	err := r.db.Where("status = ?", status).Find(&disputes).Error
	return disputes, err
}

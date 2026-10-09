package repository

import (
	"context"
	"errors"
	"payment-gateway/provider-service/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type providerRepositoryImpl struct {
	db *gorm.DB
}

func NewProviderRepository(db *gorm.DB) domain.ProviderRepository {
	return &providerRepositoryImpl{db: db}
}

func (r *providerRepositoryImpl) CreateProvider(ctx context.Context, provider *domain.Provider) error {
	return r.db.WithContext(ctx).Create(provider).Error
}

func (r *providerRepositoryImpl) GetProviderByID(ctx context.Context, id uuid.UUID) (*domain.Provider, error) {
	var provider domain.Provider
	err := r.db.WithContext(ctx).Preload("Capabilities").First(&provider, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrProviderNotFound
		}
		return nil, err
	}
	return &provider, nil
}

func (r *providerRepositoryImpl) GetProviderByCode(ctx context.Context, code string) (*domain.Provider, error) {
	var provider domain.Provider
	err := r.db.WithContext(ctx).Preload("Capabilities").First(&provider, "code = ?", code).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrProviderNotFound
		}
		return nil, err
	}
	return &provider, nil
}

func (r *providerRepositoryImpl) ListProviders(ctx context.Context) ([]domain.Provider, error) {
	var providers []domain.Provider
	err := r.db.WithContext(ctx).Preload("Capabilities").Find(&providers).Error
	return providers, err
}

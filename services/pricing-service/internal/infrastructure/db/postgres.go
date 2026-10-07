package db

import (
	"context"

	"payment-gateway/pricing-service/internal/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type PricingRepository struct {
	db *gorm.DB
}

func NewPricingRepository(dsn string) (*PricingRepository, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&domain.PricingProfile{}, &domain.FeeRule{})
	if err != nil {
		return nil, err
	}

	return &PricingRepository{db: db}, nil
}

func (r *PricingRepository) GetProfileByMerchantID(ctx context.Context, merchantID string) (*domain.PricingProfile, error) {
	var profile domain.PricingProfile
	err := r.db.WithContext(ctx).
		Preload("Rules").
		Where("merchant_id = ?", merchantID).
		First(&profile).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // Return nil if not found
		}
		return nil, err
	}
	return &profile, nil
}

func (r *PricingRepository) CreateProfile(ctx context.Context, profile *domain.PricingProfile) error {
	return r.db.WithContext(ctx).Create(profile).Error
}

func (r *PricingRepository) UpdateProfile(ctx context.Context, profile *domain.PricingProfile) error {
	return r.db.WithContext(ctx).Save(profile).Error
}

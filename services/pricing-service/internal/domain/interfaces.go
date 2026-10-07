package domain

import "context"

type PricingRepository interface {
	GetProfileByMerchantID(ctx context.Context, merchantID string) (*PricingProfile, error)
	CreateProfile(ctx context.Context, profile *PricingProfile) error
	UpdateProfile(ctx context.Context, profile *PricingProfile) error
}

type PricingEngine interface {
	CalculateFee(ctx context.Context, req CalculateFeeRequest) (*CalculateFeeResponse, error)
}

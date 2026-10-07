package service

import (
	"context"
	"testing"

	"payment-gateway/pricing-service/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockPricingRepository is a mock implementation of domain.PricingRepository
type MockPricingRepository struct {
	mock.Mock
}

func (m *MockPricingRepository) GetProfileByMerchantID(ctx context.Context, merchantID string) (*domain.PricingProfile, error) {
	args := m.Called(ctx, merchantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.PricingProfile), args.Error(1)
}

func (m *MockPricingRepository) CreateProfile(ctx context.Context, profile *domain.PricingProfile) error {
	args := m.Called(ctx, profile)
	return args.Error(0)
}

func (m *MockPricingRepository) UpdateProfile(ctx context.Context, profile *domain.PricingProfile) error {
	args := m.Called(ctx, profile)
	return args.Error(0)
}

func TestPricingEngine_CalculateFee_NoProfile(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	engine := NewPricingEngine(mockRepo)

	ctx := context.Background()
	merchantID := "no-profile-merchant"

	// Return nil to simulate no profile existing
	mockRepo.On("GetProfileByMerchantID", ctx, merchantID).Return(nil, nil)

	req := domain.CalculateFeeRequest{
		MerchantID:    merchantID,
		PaymentMethod: "VISA",
		Amount:        10000, // $100.00
		Currency:      "USD",
	}

	resp, err := engine.CalculateFee(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)

	// Default fee is 2.9% + $0.30 (30 cents)
	// 10000 * 0.029 = 290
	// 290 + 30 = 320
	expectedFee := int64(320)
	assert.Equal(t, expectedFee, resp.TotalFee)
	assert.Equal(t, expectedFee, resp.PlatformCut)
	assert.Equal(t, int64(10000)-expectedFee, resp.MerchantCut)
	assert.Empty(t, resp.AppliedRules)
}

func TestPricingEngine_CalculateFee_BaseProfile(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	engine := NewPricingEngine(mockRepo)

	ctx := context.Background()
	merchantID := "base-profile-merchant"

	// Base rate of 1.5% + $0.15
	profile := &domain.PricingProfile{
		ID:         "prof-1",
		MerchantID: merchantID,
		BaseRate:   0.015,
		BaseFixed:  15,
		Rules:      []domain.FeeRule{},
	}

	mockRepo.On("GetProfileByMerchantID", ctx, merchantID).Return(profile, nil)

	req := domain.CalculateFeeRequest{
		MerchantID:    merchantID,
		PaymentMethod: "MASTERCARD",
		Amount:        10000, // $100.00
		Currency:      "USD",
	}

	resp, err := engine.CalculateFee(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)

	// 10000 * 0.015 = 150
	// 150 + 15 = 165
	expectedFee := int64(165)
	assert.Equal(t, expectedFee, resp.TotalFee)
	assert.Equal(t, int64(10000)-expectedFee, resp.MerchantCut)
	assert.Empty(t, resp.AppliedRules)
}

func TestPricingEngine_CalculateFee_WithMethodRule(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	engine := NewPricingEngine(mockRepo)

	ctx := context.Background()
	merchantID := "rule-merchant"

	// Base rate of 1.5% + $0.15, but AMEX has a mixed override of 3.0% + $0.20
	profile := &domain.PricingProfile{
		ID:         "prof-1",
		MerchantID: merchantID,
		BaseRate:   0.015,
		BaseFixed:  15,
		Rules: []domain.FeeRule{
			{
				ID:             "rule-amex",
				ProfileID:      "prof-1",
				RuleType:       domain.FeeRuleTypeMixed,
				ConditionField: "METHOD",
				ConditionOp:    "EQUALS",
				ConditionValue: "AMEX",
				RateOverride:   0.03,
				FixedOverride:  20,
			},
		},
	}

	mockRepo.On("GetProfileByMerchantID", ctx, merchantID).Return(profile, nil)

	// Test case: AMEX (hits rule)
	reqAmex := domain.CalculateFeeRequest{
		MerchantID:    merchantID,
		PaymentMethod: "AMEX",
		Amount:        10000,
	}

	respAmex, err := engine.CalculateFee(ctx, reqAmex)
	assert.NoError(t, err)
	
	// 10000 * 0.03 = 300
	// 300 + 20 = 320
	expectedAmexFee := int64(320)
	assert.Equal(t, expectedAmexFee, respAmex.TotalFee)
	assert.Contains(t, respAmex.AppliedRules, "Rule ID: rule-amex")

	// Test case: VISA (misses rule, uses base)
	reqVisa := domain.CalculateFeeRequest{
		MerchantID:    merchantID,
		PaymentMethod: "VISA",
		Amount:        10000,
	}

	respVisa, err := engine.CalculateFee(ctx, reqVisa)
	assert.NoError(t, err)
	
	// 10000 * 0.015 = 150
	// 150 + 15 = 165
	expectedVisaFee := int64(165)
	assert.Equal(t, expectedVisaFee, respVisa.TotalFee)
	assert.Empty(t, respVisa.AppliedRules)
}

func TestPricingEngine_CalculateFee_FeeCannotExceedAmount(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	engine := NewPricingEngine(mockRepo)

	ctx := context.Background()
	merchantID := "micro-txn-merchant"

	// Default fee is 2.9% + $0.30
	mockRepo.On("GetProfileByMerchantID", ctx, merchantID).Return(nil, nil)

	// Charge is only $0.25
	req := domain.CalculateFeeRequest{
		MerchantID:    merchantID,
		PaymentMethod: "VISA",
		Amount:        25,
	}

	resp, err := engine.CalculateFee(ctx, req)

	assert.NoError(t, err)
	// Base rate would be 25 * 0.029 = 0.725
	// Total would be 0 + 30 = 30 cents, but charge is 25 cents.
	assert.Equal(t, int64(25), resp.TotalFee)
	assert.Equal(t, int64(0), resp.MerchantCut)
}

func TestPricingEngine_CalculateFee_RepositoryError(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	engine := NewPricingEngine(mockRepo)

	ctx := context.Background()
	merchantID := "error-merchant"

	mockRepo.On("GetProfileByMerchantID", ctx, merchantID).Return(nil, assert.AnError)

	req := domain.CalculateFeeRequest{
		MerchantID: merchantID,
		Amount:     1000,
	}

	resp, err := engine.CalculateFee(ctx, req)
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "failed to fetch pricing profile")
}

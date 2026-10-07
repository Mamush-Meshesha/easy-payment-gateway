package service

import (
	"context"
	"fmt"

	"payment-gateway/pricing-service/internal/domain"
)

type PricingEngineImpl struct {
	repo domain.PricingRepository
}

func NewPricingEngine(repo domain.PricingRepository) *PricingEngineImpl {
	return &PricingEngineImpl{repo: repo}
}

func (e *PricingEngineImpl) CalculateFee(ctx context.Context, req domain.CalculateFeeRequest) (*domain.CalculateFeeResponse, error) {
	profile, err := e.repo.GetProfileByMerchantID(ctx, req.MerchantID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch pricing profile: %w", err)
	}

	// Default Pricing if merchant has no profile
	baseRate := 0.029 // 2.9%
	baseFixed := int64(30) // $0.30

	if profile != nil {
		baseRate = profile.BaseRate
		baseFixed = profile.BaseFixed
	}

	appliedRules := []string{}
	finalRate := baseRate
	finalFixed := baseFixed

	if profile != nil {
		for _, rule := range profile.Rules {
			// Basic rule evaluation logic
			match := false
			if rule.ConditionField == "METHOD" {
				if rule.ConditionOp == "EQUALS" && req.PaymentMethod == rule.ConditionValue {
					match = true
				}
			} else if rule.ConditionField == "VOLUME" {
				// E.g. VOLUME > 1000000
				// Simplification for the example
				if rule.ConditionOp == "GREATER_THAN" {
					// Add proper logic here, simplified for MVP
					match = true
				}
			}

			if match {
				if rule.RuleType == domain.FeeRuleTypePercentage {
					finalRate = rule.RateOverride
				} else if rule.RuleType == domain.FeeRuleTypeFixed {
					finalFixed = rule.FixedOverride
				} else if rule.RuleType == domain.FeeRuleTypeMixed {
					finalRate = rule.RateOverride
					finalFixed = rule.FixedOverride
				}
				appliedRules = append(appliedRules, fmt.Sprintf("Rule ID: %s", rule.ID))
				break // Stop on first match for now
			}
		}
	}

	// Calculation
	percentageFee := float64(req.Amount) * finalRate
	totalFee := int64(percentageFee) + finalFixed

	if totalFee > req.Amount {
		totalFee = req.Amount // Fee cannot exceed amount
	}

	merchantCut := req.Amount - totalFee

	return &domain.CalculateFeeResponse{
		TotalFee:     totalFee,
		PlatformCut:  totalFee,
		MerchantCut:  merchantCut,
		AppliedRules: appliedRules,
	}, nil
}

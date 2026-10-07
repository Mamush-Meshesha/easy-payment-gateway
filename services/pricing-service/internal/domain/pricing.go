package domain

import (
	"time"
)

type FeeRuleType string

const (
	FeeRuleTypePercentage FeeRuleType = "PERCENTAGE"
	FeeRuleTypeFixed      FeeRuleType = "FIXED"
	FeeRuleTypeMixed      FeeRuleType = "MIXED"
)

// PricingProfile represents the overarching fee structure assigned to a merchant
type PricingProfile struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MerchantID string    `gorm:"type:uuid;not null;uniqueIndex"`
	Name       string    `gorm:"type:varchar(100);not null"`
	BaseRate   float64   `gorm:"type:decimal(5,4);not null"` // e.g., 0.0150 for 1.5%
	BaseFixed  int64     `gorm:"not null"`                   // e.g., 30 for $0.30
	IsCustom   bool      `gorm:"not null;default:false"`
	CreatedAt  time.Time `gorm:"not null;default:now()"`
	UpdatedAt  time.Time `gorm:"not null;default:now()"`

	Rules []FeeRule `gorm:"foreignKey:ProfileID"`
}

// FeeRule represents a specific rule override based on volume, payment method, etc.
type FeeRule struct {
	ID        string      `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ProfileID string      `gorm:"type:uuid;not null"`
	RuleType  FeeRuleType `gorm:"type:varchar(20);not null"`

	// Condition (simplified for now: e.g., "VOLUME", "METHOD")
	ConditionField string `gorm:"type:varchar(50);not null"`
	ConditionOp    string `gorm:"type:varchar(10);not null"`
	ConditionValue string `gorm:"type:varchar(255);not null"`

	// Outcome
	RateOverride  float64   `gorm:"type:decimal(5,4)"`
	FixedOverride int64     
	CreatedAt     time.Time `gorm:"not null;default:now()"`
}

type CalculateFeeRequest struct {
	MerchantID    string
	PaymentMethod string
	Amount        int64
	Currency      string
}

type CalculateFeeResponse struct {
	TotalFee     int64
	PlatformCut  int64
	MerchantCut  int64
	AppliedRules []string
}

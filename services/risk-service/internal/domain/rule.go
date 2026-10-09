package domain

import (
	"time"

	"github.com/google/uuid"
)

type RiskAction string

const (
	ActionAllow  RiskAction = "ALLOW"
	ActionFlag   RiskAction = "FLAG"
	ActionReview RiskAction = "REVIEW"
	ActionBlock  RiskAction = "BLOCK"
)

type RuleCondition struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"`
	Value    interface{} `json:"value"`
	// For Compound rules (AND, OR, NOT)
	Conditions []RuleCondition `json:"conditions,omitempty"`
}

type RiskRule struct {
	ID             uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey"`
	Name           string        `json:"name" gorm:"type:varchar(255);not null"`
	Priority       int           `json:"priority" gorm:"not null;index"`
	Condition      RuleCondition `json:"condition" gorm:"type:jsonb;not null;serializer:json"`
	Action         RiskAction    `json:"action" gorm:"type:varchar(20);not null"`
	StopProcessing bool          `json:"stopProcessing" gorm:"not null;default:false"`
	IsActive       bool          `json:"isActive" gorm:"not null;default:true"`
	Version        int           `json:"version" gorm:"not null;default:1"`
	CreatedAt      time.Time     `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt      time.Time     `json:"updatedAt" gorm:"autoUpdateTime"`
}

type RiskDecision struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	PaymentID       uuid.UUID  `json:"paymentId" gorm:"type:uuid;not null;index"`
	MerchantID      uuid.UUID  `json:"merchantId" gorm:"type:uuid;not null;index"`
	TriggeredRuleID *uuid.UUID `json:"triggeredRuleId" gorm:"type:uuid"`
	ActionTaken     RiskAction `json:"actionTaken" gorm:"type:varchar(20);not null"`
	Reason          string     `json:"reason" gorm:"type:text"`
	MLScore         float32    `json:"mlScore" gorm:"type:real"`
	Amount          int64      `json:"amount" gorm:"not null;default:0"`
	Currency        string     `json:"currency" gorm:"type:varchar(3);not null;default:'ETB'"`
	Requires3DS     bool       `json:"requires3ds" gorm:"not null;default:false"`
	CreatedAt       time.Time  `json:"createdAt" gorm:"autoCreateTime"`
}

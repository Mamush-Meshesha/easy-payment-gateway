package domain

import (
	"context"

	"github.com/google/uuid"
)

type CheckRiskRequest struct {
	PaymentID     uuid.UUID
	MerchantID    uuid.UUID
	Amount        int64
	Currency      string
	CustomerID    string
	IPAddress     string
	PaymentMethod string
}

type CheckRiskResponse struct {
	DecisionID       uuid.UUID
	Action           RiskAction
	Reason           string
	TriggeredRuleIDs []uuid.UUID
}

// Repositories
type RiskRuleRepository interface {
	GetActiveRules(ctx context.Context) ([]RiskRule, error)
	CreateRule(ctx context.Context, rule *RiskRule) error
	RecordDecision(ctx context.Context, decision *RiskDecision) error
	GetAnalytics(ctx context.Context) (interface{}, error)
}

type VelocityCache interface {
	// IncrementAndCheck safely increments a velocity counter atomically using Lua
	// Returns true if the limit is exceeded.
	IncrementAndCheck(ctx context.Context, key string, windowSeconds int, limit int64) (bool, error)
}

// Services
type RiskService interface {
	CheckRisk(ctx context.Context, req *CheckRiskRequest) (*CheckRiskResponse, error)
	GetActiveRules(ctx context.Context) ([]RiskRule, error)
	CreateRule(ctx context.Context, rule *RiskRule) error
	GetAnalytics(ctx context.Context) (interface{}, error)
	RecordDecision(ctx context.Context, decision *RiskDecision) error
}

type RuleEvaluator interface {
	Evaluate(req *CheckRiskRequest, rules []RiskRule) (RiskAction, *RiskRule, error)
}

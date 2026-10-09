package service

import (
	"payment-gateway/risk-service/internal/domain"
	"testing"

	"github.com/google/uuid"
)

func TestEvaluate_Operators(t *testing.T) {
	eval := NewRuleEvaluator()
	req := &domain.CheckRiskRequest{
		Amount:    5000,
		Currency:  "ETB",
		IPAddress: "192.168.1.1",
	}

	tests := []struct {
		name      string
		condition domain.RuleCondition
		expected  bool
	}{
		{">", domain.RuleCondition{Field: "amount", Operator: ">", Value: float64(4000)}, true},
		{"> (false)", domain.RuleCondition{Field: "amount", Operator: ">", Value: float64(6000)}, false},
		{"==", domain.RuleCondition{Field: "currency", Operator: "==", Value: "ETB"}, true},
		{"!=", domain.RuleCondition{Field: "currency", Operator: "!=", Value: "USD"}, true},
		{"IN", domain.RuleCondition{Field: "currency", Operator: "IN", Value: []interface{}{"ETB", "USD"}}, true},
		{"NOT_IN", domain.RuleCondition{Field: "currency", Operator: "NOT_IN", Value: []interface{}{"USD", "EUR"}}, true},
		{"EXISTS (true)", domain.RuleCondition{Field: "ip_address", Operator: "EXISTS", Value: true}, true},
		{"EXISTS (false)", domain.RuleCondition{Field: "customer_id", Operator: "EXISTS", Value: false}, true},
		{"AND", domain.RuleCondition{
			Operator: "AND",
			Conditions: []domain.RuleCondition{
				{Field: "amount", Operator: ">", Value: float64(1000)},
				{Field: "currency", Operator: "==", Value: "ETB"},
			},
		}, true},
		{"OR (true)", domain.RuleCondition{
			Operator: "OR",
			Conditions: []domain.RuleCondition{
				{Field: "currency", Operator: "==", Value: "USD"},
				{Field: "amount", Operator: "==", Value: float64(5000)},
			},
		}, true},
		{"NOT", domain.RuleCondition{
			Operator: "NOT",
			Conditions: []domain.RuleCondition{
				{Field: "currency", Operator: "==", Value: "USD"},
			},
		}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			action, _, _ := eval.Evaluate(req, []domain.RiskRule{
				{IsActive: true, Priority: 1, Action: domain.ActionBlock, Condition: tt.condition},
			})
			matched := action == domain.ActionBlock
			if matched != tt.expected {
				t.Errorf("Expected match=%v, got %v for op %s", tt.expected, matched, tt.name)
			}
		})
	}
}

func TestEvaluate_Precedence_And_Priority(t *testing.T) {
	eval := NewRuleEvaluator()
	req := &domain.CheckRiskRequest{
		Amount: 5000,
	}

	r1 := domain.RiskRule{
		ID:        uuid.New(),
		Name:      "Flag large",
		IsActive:  true,
		Priority:  10,
		Action:    domain.ActionFlag,
		Condition: domain.RuleCondition{Field: "amount", Operator: ">", Value: float64(1000)},
	}
	r2 := domain.RiskRule{
		ID:        uuid.New(),
		Name:      "Block huge",
		IsActive:  true,
		Priority:  5, // Lower priority
		Action:    domain.ActionBlock,
		Condition: domain.RuleCondition{Field: "amount", Operator: ">", Value: float64(4000)},
	}

	// Because BLOCK > FLAG in precedence, even if FLAG has higher priority and executes first, BLOCK should win.
	action, rule, _ := eval.Evaluate(req, []domain.RiskRule{r1, r2})
	if action != domain.ActionBlock {
		t.Errorf("Expected BLOCK, got %v", action)
	}
	if rule.ID != r2.ID {
		t.Errorf("Expected Triggered rule to be %s, got %s", r2.Name, rule.Name)
	}
}

func TestEvaluate_StopProcessing(t *testing.T) {
	eval := NewRuleEvaluator()
	req := &domain.CheckRiskRequest{
		Amount: 5000,
	}

	r1 := domain.RiskRule{
		ID:             uuid.New(),
		Name:           "Allow safe customers",
		IsActive:       true,
		Priority:       100, // Evaluated first
		Action:         domain.ActionAllow,
		StopProcessing: true,
		Condition:      domain.RuleCondition{Field: "amount", Operator: ">", Value: float64(1000)},
	}
	r2 := domain.RiskRule{
		ID:        uuid.New(),
		Name:      "Block huge",
		IsActive:  true,
		Priority:  50, // Lower priority
		Action:    domain.ActionBlock,
		Condition: domain.RuleCondition{Field: "amount", Operator: ">", Value: float64(4000)},
	}

	// Because of StopProcessing = true on the higher priority rule, r2 should never evaluate.
	action, rule, _ := eval.Evaluate(req, []domain.RiskRule{r1, r2})
	if action != domain.ActionAllow {
		t.Errorf("Expected ALLOW (stop processing), got %v", action)
	}
	if rule.ID != r1.ID {
		t.Errorf("Expected Triggered rule to be %s, got %s", r1.Name, rule.Name)
	}
}

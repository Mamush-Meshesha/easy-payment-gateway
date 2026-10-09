package service

import (
	"fmt"
	"payment-gateway/risk-service/internal/domain"
	"reflect"
	"sort"
)

type DefaultRuleEvaluator struct{}

func NewRuleEvaluator() domain.RuleEvaluator {
	return &DefaultRuleEvaluator{}
}

// Evaluate runs the incoming request against all active rules, sorted by priority.
// Returns the Action to take, and the specific Rule that triggered it (if any).
func (e *DefaultRuleEvaluator) Evaluate(req *domain.CheckRiskRequest, rules []domain.RiskRule) (domain.RiskAction, *domain.RiskRule, error) {
	// 1. Filter active rules and sort by priority (descending, so higher priority is evaluated first)
	activeRules := make([]domain.RiskRule, 0)
	for _, r := range rules {
		if r.IsActive {
			activeRules = append(activeRules, r)
		}
	}

	sort.SliceStable(activeRules, func(i, j int) bool {
		return activeRules[i].Priority > activeRules[j].Priority
	})

	// 2. Build the context map for evaluation
	ctx := map[string]interface{}{
		"amount":      float64(req.Amount),
		"payment_id":  req.PaymentID.String(),
		"merchant_id": req.MerchantID.String(),
	}

	if req.Currency != "" {
		ctx["currency"] = req.Currency
	}
	if req.CustomerID != "" {
		ctx["customer_id"] = req.CustomerID
	}
	if req.IPAddress != "" {
		ctx["ip_address"] = req.IPAddress
	}
	if req.PaymentMethod != "" {
		ctx["payment_method"] = req.PaymentMethod
	}

	var strictestAction domain.RiskAction = domain.ActionAllow
	var triggeredRule *domain.RiskRule = nil

	// 3. Evaluate rules
	for _, rule := range activeRules {
		matched, err := e.evaluateCondition(ctx, rule.Condition)
		if err != nil {
			// Log error but continue evaluating (or fail closed depending on strictness)
			continue
		}

		if matched {
			if triggeredRule == nil || precedence(rule.Action) > precedence(strictestAction) {
				strictestAction = rule.Action

				// Need a persistent pointer
				r := rule
				triggeredRule = &r
			}

			if rule.StopProcessing {
				break
			}
		}
	}

	return strictestAction, triggeredRule, nil
}

func precedence(action domain.RiskAction) int {
	switch action {
	case domain.ActionBlock:
		return 4
	case domain.ActionReview:
		return 3
	case domain.ActionFlag:
		return 2
	case domain.ActionAllow:
		return 1
	default:
		return 0
	}
}

func (e *DefaultRuleEvaluator) evaluateCondition(ctx map[string]interface{}, cond domain.RuleCondition) (bool, error) {
	switch cond.Operator {
	case "AND":
		for _, c := range cond.Conditions {
			res, err := e.evaluateCondition(ctx, c)
			if err != nil || !res {
				return false, err
			}
		}
		return true, nil
	case "OR":
		for _, c := range cond.Conditions {
			res, err := e.evaluateCondition(ctx, c)
			if err == nil && res {
				return true, nil
			}
		}
		return false, nil
	case "NOT":
		if len(cond.Conditions) != 1 {
			return false, fmt.Errorf("NOT operator expects exactly 1 condition")
		}
		res, err := e.evaluateCondition(ctx, cond.Conditions[0])
		return !res, err
	}

	// Leaf operators
	fieldVal, exists := ctx[cond.Field]

	if cond.Operator == "EXISTS" {
		expected, ok := cond.Value.(bool)
		if !ok {
			return false, fmt.Errorf("EXISTS value must be boolean")
		}
		return exists == expected, nil
	}

	if !exists {
		return false, nil // Field not present, cannot match
	}

	switch cond.Operator {
	case "==":
		return reflect.DeepEqual(fieldVal, cond.Value), nil
	case "!=":
		return !reflect.DeepEqual(fieldVal, cond.Value), nil
	case ">", ">=", "<", "<=":
		return compareNumeric(fieldVal, cond.Value, cond.Operator)
	case "IN", "NOT_IN":
		return evaluateIn(fieldVal, cond.Value, cond.Operator)
	default:
		return false, fmt.Errorf("unknown operator %s", cond.Operator)
	}
}

func compareNumeric(fieldVal, condVal interface{}, op string) (bool, error) {
	var f1, f2 float64

	switch v := fieldVal.(type) {
	case float64:
		f1 = v
	case int:
		f1 = float64(v)
	default:
		return false, fmt.Errorf("field is not numeric")
	}

	switch v := condVal.(type) {
	case float64:
		f2 = v
	case int:
		f2 = float64(v)
	default:
		return false, fmt.Errorf("condition value is not numeric")
	}

	switch op {
	case ">":
		return f1 > f2, nil
	case ">=":
		return f1 >= f2, nil
	case "<":
		return f1 < f2, nil
	case "<=":
		return f1 <= f2, nil
	}
	return false, nil
}

func evaluateIn(fieldVal, condVal interface{}, op string) (bool, error) {
	condList, ok := condVal.([]interface{})
	if !ok {
		return false, fmt.Errorf("IN/NOT_IN value must be an array")
	}

	found := false
	for _, v := range condList {
		if reflect.DeepEqual(fieldVal, v) {
			found = true
			break
		}
	}

	if op == "IN" {
		return found, nil
	}
	return !found, nil
}

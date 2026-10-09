package service

import (
	"context"
	"fmt"
	"log"
	"payment-gateway/risk-service/internal/domain"
	"sync"
	"time"

	"github.com/google/uuid"
)

type RiskServiceImpl struct {
	repo      domain.RiskRuleRepository
	velocity  domain.VelocityCache
	evaluator domain.RuleEvaluator

	// In-memory cache of rules
	mu           sync.RWMutex
	cachedRules  []domain.RiskRule
	lastLoadTime time.Time
	cacheTTL     time.Duration
}

func NewRiskService(repo domain.RiskRuleRepository, velocity domain.VelocityCache, evaluator domain.RuleEvaluator) domain.RiskService {
	svc := &RiskServiceImpl{
		repo:      repo,
		velocity:  velocity,
		evaluator: evaluator,
		cacheTTL:  time.Minute * 5, // Fallback TTL
	}
	// Initial load
	svc.reloadRules(context.Background())
	return svc
}

func (s *RiskServiceImpl) reloadRules(ctx context.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()

	rules, err := s.repo.GetActiveRules(ctx)
	if err != nil {
		log.Printf("Failed to load rules: %v", err)
		return
	}
	s.cachedRules = rules
	s.lastLoadTime = time.Now()
}

func (s *RiskServiceImpl) GetActiveRules(ctx context.Context) ([]domain.RiskRule, error) {
	s.mu.RLock()
	stale := time.Since(s.lastLoadTime) > s.cacheTTL
	rules := s.cachedRules
	s.mu.RUnlock()

	if stale {
		s.reloadRules(ctx)
		s.mu.RLock()
		rules = s.cachedRules
		s.mu.RUnlock()
	}

	return rules, nil
}

func (s *RiskServiceImpl) CreateRule(ctx context.Context, rule *domain.RiskRule) error {
	if rule.ID == uuid.Nil {
		rule.ID = uuid.New()
	}
	if err := s.repo.CreateRule(ctx, rule); err != nil {
		return err
	}
	s.reloadRules(ctx)
	return nil
}

func (s *RiskServiceImpl) CheckRisk(ctx context.Context, req *domain.CheckRiskRequest) (*domain.CheckRiskResponse, error) {
	decisionID := uuid.New()
	response := &domain.CheckRiskResponse{
		DecisionID: decisionID,
		Action:     domain.ActionAllow,
	}

	// 1. Velocity Checks (e.g., hardcoded global velocity for this example: 10 txns / minute per customer)
	// In a real system, these would also be configurable rules in the DB.
	if req.CustomerID != "" {
		key := fmt.Sprintf("velocity:customer:%s:minute", req.CustomerID)
		exceeded, err := s.velocity.IncrementAndCheck(ctx, key, 60, 10)
		if err != nil {
			// If Redis is down, we must NOT silently allow or block without explicit policy.
			// Policy: UNAVAILABLE
			return nil, fmt.Errorf("velocity check failed: %w", err)
		}
		if exceeded {
			s.RecordDecision(ctx, &domain.RiskDecision{
				ID:          decisionID,
				PaymentID:   req.PaymentID,
				MerchantID:  req.MerchantID,
				ActionTaken: domain.ActionBlock,
				Reason:      "Velocity limit exceeded",
				Amount:      req.Amount,
				Currency:    req.Currency,
			})
			response.Action = domain.ActionBlock
			response.Reason = "Velocity limit exceeded"
			return response, nil
		}
	}

	// 2. Evaluate Dynamic Rules
	rules, err := s.GetActiveRules(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get active rules: %w", err)
	}

	action, triggeredRule, err := s.evaluator.Evaluate(req, rules)
	if err != nil {
		// Evaluator errs mean some rules were malformed, but we still have an action
		log.Printf("Rule evaluation encountered errors: %v", err)
	}

	response.Action = action
	if triggeredRule != nil {
		response.TriggeredRuleIDs = []uuid.UUID{triggeredRule.ID}
		response.Reason = triggeredRule.Name
	} else {
		response.Reason = "Default ALLOW"
	}

	// Note: We no longer call asyncAudit here. The gRPC layer will call RecordDecision after ML evaluation.

	return response, nil
}

func (s *RiskServiceImpl) RecordDecision(ctx context.Context, decision *domain.RiskDecision) error {
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.repo.RecordDecision(bgCtx, decision); err != nil {
			log.Printf("Failed to record risk decision audit: %v", err)
		}
	}()
	return nil
}

func (s *RiskServiceImpl) GetAnalytics(ctx context.Context) (interface{}, error) {
	return s.repo.GetAnalytics(ctx)
}

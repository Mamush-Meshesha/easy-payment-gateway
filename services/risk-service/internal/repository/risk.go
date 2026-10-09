package repository

import (
	"context"
	"payment-gateway/risk-service/internal/domain"

	"gorm.io/gorm"
)

type RiskRepositoryImpl struct {
	db *gorm.DB
}

func NewRiskRepository(db *gorm.DB) domain.RiskRuleRepository {
	return &RiskRepositoryImpl{db: db}
}

func (r *RiskRepositoryImpl) GetActiveRules(ctx context.Context) ([]domain.RiskRule, error) {
	var rules []domain.RiskRule
	if err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("priority DESC").Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *RiskRepositoryImpl) CreateRule(ctx context.Context, rule *domain.RiskRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *RiskRepositoryImpl) RecordDecision(ctx context.Context, decision *domain.RiskDecision) error {
	// The user explicitly stated: "The synchronous risk response must NOT wait unnecessarily for an audit INSERT."
	// However, they also stated "every risk decision must eventually become durably persisted."
	// Normally, we'd fire an event to Kafka or a background goroutine for async insert.
	// Since this repository is a synchronous abstraction, we will handle async in the Service layer,
	// and this just does the DB write.
	return r.db.WithContext(ctx).Create(decision).Error
}

type RiskStats struct {
	TotalScored        int64                 `json:"totalScored"`
	BlockedCount       int64                 `json:"blockedCount"`
	ChallengedCount    int64                 `json:"challengedCount"`
	AllowedCount       int64                 `json:"allowedCount"`
	AverageScore       float64               `json:"averageScore"`
	RecentTransactions []domain.RiskDecision `json:"recentTransactions"`
}

func (r *RiskRepositoryImpl) GetAnalytics(ctx context.Context) (interface{}, error) {
	var stats RiskStats

	r.db.WithContext(ctx).Model(&domain.RiskDecision{}).Count(&stats.TotalScored)
	r.db.WithContext(ctx).Model(&domain.RiskDecision{}).Where("action_taken = ?", domain.ActionBlock).Count(&stats.BlockedCount)
	r.db.WithContext(ctx).Model(&domain.RiskDecision{}).Where("action_taken = ?", "CHALLENGE").Count(&stats.ChallengedCount)
	r.db.WithContext(ctx).Model(&domain.RiskDecision{}).Where("action_taken = ?", domain.ActionAllow).Count(&stats.AllowedCount)

	// Calculate average ML score
	r.db.WithContext(ctx).Model(&domain.RiskDecision{}).Select("COALESCE(AVG(ml_score), 0)").Scan(&stats.AverageScore)

	// Fetch recent 10 transactions
	r.db.WithContext(ctx).Order("created_at DESC").Limit(10).Find(&stats.RecentTransactions)

	return &stats, nil
}

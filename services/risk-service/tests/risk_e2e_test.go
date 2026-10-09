package tests

import (
	"context"
	"fmt"
	"payment-gateway/risk-service/internal/cache"
	"payment-gateway/risk-service/internal/domain"
	grpchandler "payment-gateway/risk-service/internal/handler/grpc"
	"payment-gateway/risk-service/internal/repository"
	"payment-gateway/risk-service/internal/service"
	pb "payment-gateway/risk-service/proto"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*gorm.DB, *miniredis.Miniredis, func() pb.RiskServiceServer) {
	dbName := fmt.Sprintf("file:%s?mode=memory&cache=shared", uuid.NewString())
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open sqlite memory db: %v", err)
	}

	err = db.AutoMigrate(&domain.RiskRule{}, &domain.RiskDecision{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("Failed to start miniredis: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	startServer := func() pb.RiskServiceServer {
		repo := repository.NewRiskRepository(db)
		velocityCache := cache.NewRedisVelocityCache(rdb)
		evaluator := service.NewRuleEvaluator()
		svc := service.NewRiskService(repo, velocityCache, evaluator)

		return grpchandler.NewRiskGrpcServer(svc)
	}

	return db, mr, startServer
}

func TestCheckRisk_VelocityExceeded(t *testing.T) {
	db, _, startServer := setupTestEnvironment(t)

	// Create an ALLOW rule so that non-velocity blocked requests would pass
	db.Create(&domain.RiskRule{
		ID:        uuid.New(),
		Name:      "Default Allow",
		IsActive:  true,
		Action:    domain.ActionAllow,
		Condition: domain.RuleCondition{Field: "currency", Operator: "==", Value: "ETB"},
	})

	grpcServer := startServer()

	customerID := "cust_vel_test"
	req := &pb.CheckRiskRequest{
		PaymentId:  uuid.NewString(),
		MerchantId: uuid.NewString(),
		CustomerId: customerID,
		Currency:   "ETB",
		Amount:     5000,
	}

	// We configured the hardcoded velocity limit to 10 in the RiskService CheckRisk method for this MVP.
	for i := 0; i < 10; i++ {
		res, err := grpcServer.CheckRisk(context.Background(), req)
		if err != nil {
			t.Fatalf("Unexpected error on request %d: %v", i, err)
		}
		if res.Action != "ALLOW" {
			t.Fatalf("Expected ALLOW for request %d, got %s", i, res.Action)
		}
	}

	// 11th request should trigger BLOCK via Velocity
	res, err := grpcServer.CheckRisk(context.Background(), req)
	if err != nil {
		t.Fatalf("Unexpected error on 11th request: %v", err)
	}
	if res.Action != "BLOCK" {
		t.Errorf("Expected BLOCK for 11th request due to velocity limit, got %s", res.Action)
	}
	if res.Reason != "Velocity limit exceeded" {
		t.Errorf("Expected Reason 'Velocity limit exceeded', got %s", res.Reason)
	}
}

func TestCheckRisk_UnavailableRedis(t *testing.T) {
	_, mr, startServer := setupTestEnvironment(t)
	grpcServer := startServer()

	// Shut down Redis to simulate failure
	mr.Close()

	req := &pb.CheckRiskRequest{
		PaymentId:  uuid.NewString(),
		MerchantId: uuid.NewString(),
		CustomerId: "cust_unavail_test",
		Currency:   "ETB",
	}

	// "The gRPC response must make this distinction explicit... Not confuse RISK_BLOCK with RISK_SERVICE_UNAVAILABLE"
	res, err := grpcServer.CheckRisk(context.Background(), req)
	if err != nil {
		t.Fatalf("Unexpected err (grpc handler should catch it): %v", err)
	}

	if res.EvaluationStatus != "UNAVAILABLE" {
		t.Errorf("Expected EvaluationStatus 'UNAVAILABLE', got %s", res.EvaluationStatus)
	}
}

func TestCheckRisk_RulePriority(t *testing.T) {
	db, _, startServer := setupTestEnvironment(t)

	// Rule 1: High priority FLAG
	db.Create(&domain.RiskRule{
		ID:        uuid.New(),
		Name:      "High Priority Flag",
		IsActive:  true,
		Priority:  100,
		Action:    domain.ActionFlag,
		Condition: domain.RuleCondition{Field: "currency", Operator: "==", Value: "ETB"},
	})

	// Rule 2: Low priority BLOCK
	db.Create(&domain.RiskRule{
		ID:        uuid.New(),
		Name:      "Low Priority Block",
		IsActive:  true,
		Priority:  10,
		Action:    domain.ActionBlock,
		Condition: domain.RuleCondition{Field: "amount", Operator: ">", Value: float64(1000)},
	})

	grpcServer := startServer()

	req := &pb.CheckRiskRequest{
		PaymentId:  uuid.NewString(),
		MerchantId: uuid.NewString(),
		CustomerId: "cust_test_priority",
		Currency:   "ETB",
		Amount:     5000,
	}

	// Because we wait for async caches, we need to manually trigger reload for tests
	// The constructor triggers reload once.
	// We'll sleep a tiny bit to ensure the async insert completes (for other tests, not this one necessarily)

	res, err := grpcServer.CheckRisk(context.Background(), req)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// BLOCK should override FLAG regardless of priority because of precedence in our rule engine
	if res.Action != "BLOCK" {
		t.Errorf("Expected BLOCK precedence, got %s", res.Action)
	}

	// Verify the async audit log eventually wrote the RiskDecision
	time.Sleep(50 * time.Millisecond)
	var count int64
	db.Model(&domain.RiskDecision{}).Count(&count)
	if count != 1 {
		t.Errorf("Expected 1 RiskDecision audit log, got %d", count)
	}
}

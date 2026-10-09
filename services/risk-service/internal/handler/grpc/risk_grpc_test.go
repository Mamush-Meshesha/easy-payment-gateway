package grpc

import (
	"context"
	"payment-gateway/risk-service/internal/domain"
	pb "payment-gateway/risk-service/proto"
	mlpb "payment-gateway/risk-service/proto/ml"
	"testing"

	"github.com/google/uuid"
	"google.golang.org/grpc"
)

// Mock RiskService
type MockRiskService struct{}

func (m *MockRiskService) CheckRisk(ctx context.Context, req *domain.CheckRiskRequest) (*domain.CheckRiskResponse, error) {
	return &domain.CheckRiskResponse{
		DecisionID: uuid.New(),
		Action:     domain.ActionAllow,
		Reason:     "Default Allow from Basic Rules",
	}, nil
}
func (m *MockRiskService) CreateRule(ctx context.Context, rule *domain.RiskRule) error { return nil }
func (m *MockRiskService) GetActiveRules(ctx context.Context) ([]domain.RiskRule, error) { return nil, nil }

// Mock ML Client
type MockMLClient struct {
	score float32
	err   error
}

func (m *MockMLClient) EvaluateFraudProbability(ctx context.Context, in *mlpb.EvaluateFraudRequest, opts ...grpc.CallOption) (*mlpb.EvaluateFraudResponse, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &mlpb.EvaluateFraudResponse{
		ProbabilityScore: m.score,
	}, nil
}

func TestRiskGrpcServer_CheckRisk_MLIntegration(t *testing.T) {
	validPaymentID := uuid.New().String()
	validMerchantID := uuid.New().String()

	tests := []struct {
		name         string
		mlScore      float32
		expectedAct  string
		expected3DS  bool
	}{
		{"Low Risk - Allow", 0.1, "ALLOW", false},
		{"Medium Risk - Challenge 3DS2", 0.5, "CHALLENGE", true},
		{"High Risk - Block", 0.9, "BLOCK", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := &MockRiskService{}
			ml := &MockMLClient{score: tt.mlScore}
			server := &RiskGrpcServer{
				service:  svc,
				mlClient: ml,
			}

			req := &pb.CheckRiskRequest{
				PaymentId:     validPaymentID,
				MerchantId:    validMerchantID,
				Amount:        50000,
				Currency:      "ETB",
			}

			res, err := server.CheckRisk(context.Background(), req)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if res.Action != tt.expectedAct {
				t.Errorf("expected action %s, got %s", tt.expectedAct, res.Action)
			}

			if res.Requires_3Ds != tt.expected3DS {
				t.Errorf("expected requires3DS=%v, got %v", tt.expected3DS, res.Requires_3Ds)
			}
		})
	}
}

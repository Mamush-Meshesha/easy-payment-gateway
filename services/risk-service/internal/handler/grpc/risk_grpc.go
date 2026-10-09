package grpc

import (
	"context"
	"payment-gateway/risk-service/internal/domain"
	pb "payment-gateway/risk-service/proto"

	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	mlpb "payment-gateway/risk-service/proto/ml"
)

type RiskGrpcServer struct {
	pb.UnimplementedRiskServiceServer
	service domain.RiskService
	mlClient mlpb.RiskMLServiceClient
}

func NewRiskGrpcServer(service domain.RiskService) *RiskGrpcServer {
	mlAddr := "localhost:50068"
	conn, err := grpc.Dial(mlAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	var mlClient mlpb.RiskMLServiceClient
	if err == nil {
		mlClient = mlpb.NewRiskMLServiceClient(conn)
	}
	return &RiskGrpcServer{service: service, mlClient: mlClient}
}

func (s *RiskGrpcServer) CheckRisk(ctx context.Context, req *pb.CheckRiskRequest) (*pb.CheckRiskResponse, error) {
	paymentID, err := uuid.Parse(req.PaymentId)
	if err != nil {
		return &pb.CheckRiskResponse{
			EvaluationStatus: "ERROR",
			Reason:           "invalid payment_id UUID",
		}, nil
	}

	merchantID, err := uuid.Parse(req.MerchantId)
	if err != nil {
		return &pb.CheckRiskResponse{
			EvaluationStatus: "ERROR",
			Reason:           "invalid merchant_id UUID",
		}, nil
	}

	svcReq := &domain.CheckRiskRequest{
		PaymentID:     paymentID,
		MerchantID:    merchantID,
		Amount:        req.Amount,
		Currency:      req.Currency,
		CustomerID:    req.CustomerId,
		IPAddress:     req.IpAddress,
		PaymentMethod: req.PaymentMethod,
	}

	res, err := s.service.CheckRisk(ctx, svcReq)
	if err != nil {
		// Differentiate between generic errors and timeouts/unavailability
		// For simplicity, returning UNAVAILABLE if the service returns an error
		// (e.g. Redis connection failure during velocity check)
		return &pb.CheckRiskResponse{
			EvaluationStatus: "UNAVAILABLE",
			Reason:           err.Error(),
		}, nil
	}

	// Map domain response to pb
	var triggeredRuleStrs []string
	for _, id := range res.TriggeredRuleIDs {
		triggeredRuleStrs = append(triggeredRuleStrs, id.String())
	}

	var riskScore float32 = 0.0
	var requires3ds bool = false

	if s.mlClient != nil {
		mlRes, err := s.mlClient.EvaluateFraudProbability(ctx, &mlpb.EvaluateFraudRequest{
			IpAddress:  req.IpAddress,
			Amount:     req.Amount,
			Currency:   req.Currency,
			CustomerId: req.CustomerId,
			MerchantId: req.MerchantId,
		})
		if err == nil && mlRes != nil {
			riskScore = mlRes.ProbabilityScore
			if riskScore >= 0.8 {
				res.Action = domain.ActionBlock
				res.Reason = "ML_HIGH_RISK_BLOCK"
			} else if riskScore >= 0.4 {
				res.Action = "CHALLENGE"
				res.Reason = "ML_ELEVATED_RISK_3DS2"
				requires3ds = true
			}
		}
	}

	var ruleID *uuid.UUID
	if len(res.TriggeredRuleIDs) > 0 {
		ruleID = &res.TriggeredRuleIDs[0]
	}

	decision := &domain.RiskDecision{
		ID:              res.DecisionID,
		PaymentID:       paymentID,
		MerchantID:      merchantID,
		TriggeredRuleID: ruleID,
		ActionTaken:     res.Action,
		Reason:          res.Reason,
		MLScore:         riskScore,
		Amount:          req.Amount,
		Currency:        req.Currency,
		Requires3DS:     requires3ds,
	}
	s.service.RecordDecision(ctx, decision)

	return &pb.CheckRiskResponse{
		DecisionId:       res.DecisionID.String(),
		Action:           string(res.Action),
		Reason:           res.Reason,
		TriggeredRuleIds: triggeredRuleStrs,
		EvaluationStatus: "SUCCESS",
		RiskScore:        riskScore,
		Requires_3Ds:     requires3ds,
	}, nil
}

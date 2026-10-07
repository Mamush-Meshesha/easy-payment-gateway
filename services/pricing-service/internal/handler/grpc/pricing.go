package grpc

import (
	"context"

	"payment-gateway/pricing-service/internal/domain"
	pb "payment-gateway/pricing-service/pb"
)

type PricingGrpcHandler struct {
	pb.UnimplementedPricingServiceServer
	engine domain.PricingEngine
}

func NewPricingGrpcHandler(engine domain.PricingEngine) *PricingGrpcHandler {
	return &PricingGrpcHandler{engine: engine}
}

func (h *PricingGrpcHandler) CalculateFee(ctx context.Context, req *pb.CalculateFeeRequest) (*pb.CalculateFeeResponse, error) {
	resp, err := h.engine.CalculateFee(ctx, domain.CalculateFeeRequest{
		MerchantID:    req.MerchantId,
		PaymentMethod: req.PaymentMethod,
		Amount:        req.Amount,
		Currency:      req.Currency,
	})
	if err != nil {
		return nil, err
	}

	return &pb.CalculateFeeResponse{
		TotalFee:     resp.TotalFee,
		PlatformCut:  resp.PlatformCut,
		MerchantCut:  resp.MerchantCut,
		AppliedRules: resp.AppliedRules,
	}, nil
}

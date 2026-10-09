package grpc

import (
	"context"
	"payment-gateway/provider-service/internal/domain"
	pb "payment-gateway/provider-service/proto"
)

type ProviderGrpcServer struct {
	pb.UnimplementedProviderServiceServer
	service domain.ProviderService
}

func NewProviderGrpcServer(service domain.ProviderService) *ProviderGrpcServer {
	return &ProviderGrpcServer{service: service}
}

func (s *ProviderGrpcServer) GetProviderStatus(ctx context.Context, req *pb.ProviderStatusRequest) (*pb.ProviderStatusResponse, error) {
	provider, err := s.service.GetProvider(ctx, req.ProviderId)
	if err != nil {
		if err == domain.ErrProviderNotFound {
			return &pb.ProviderStatusResponse{
				IsActive: false,
				Error:    "Provider not found",
			}, nil
		}
		return &pb.ProviderStatusResponse{
			IsActive: false,
			Error:    err.Error(),
		}, nil
	}

	return &pb.ProviderStatusResponse{
		IsActive: provider.Status == domain.ProviderStatusActive,
		Error:    "",
	}, nil
}

func (s *ProviderGrpcServer) InitiatePayment(ctx context.Context, req *pb.InitiatePaymentRequest) (*pb.InitiatePaymentResponse, error) {
	status, err := s.service.InitiatePayment(ctx, req.ProviderId, req.PaymentId, req.Amount, req.Currency, req.Environment)
	if err != nil {
		return nil, err
	}
	return &pb.InitiatePaymentResponse{
		Status: status,
	}, nil
}

func (s *ProviderGrpcServer) InitiateRefund(ctx context.Context, req *pb.InitiateRefundRequest) (*pb.InitiateRefundResponse, error) {
	status, err := s.service.InitiateRefund(ctx, req.ProviderId, req.RefundId, req.Amount, req.Currency, req.Environment)
	if err != nil {
		return nil, err
	}
	return &pb.InitiateRefundResponse{
		Status: status,
	}, nil
}

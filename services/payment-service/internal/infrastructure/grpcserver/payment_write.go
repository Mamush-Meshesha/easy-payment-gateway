package grpcserver

import (
	"context"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/payment-service/internal/domain"
	pb "payment-gateway/payment-service/proto"
)

type PaymentWriteGrpcServer struct {
	pb.UnimplementedPaymentWriteServiceServer
	repo         domain.PaymentRepository
	orchestrator domain.PaymentOrchestrator
}

func NewPaymentWriteGrpcServer(repo domain.PaymentRepository, orchestrator domain.PaymentOrchestrator) *PaymentWriteGrpcServer {
	return &PaymentWriteGrpcServer{
		repo:         repo,
		orchestrator: orchestrator,
	}
}

func (s *PaymentWriteGrpcServer) ExecutePayment(ctx context.Context, req *pb.ExecutePaymentRequest) (*pb.ExecutePaymentResponse, error) {
	reqCtx, err := grpcauth.ExtractRequestContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "missing request context")
	}

	// Tenant Isolation Check
	isSuperAdmin := false
	for _, role := range reqCtx.Roles {
		if role == "SUPER_ADMIN" {
			isSuperAdmin = true
			break
		}
	}

	if reqCtx.MerchantId != req.MerchantId && !isSuperAdmin {
		return nil, status.Error(codes.PermissionDenied, "tenant isolation violation")
	}

	merchantID, err := uuid.Parse(req.MerchantId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid merchant_id")
	}

	// Default to LIVE for billing triggered payments, unless in test env
	// (simplified for now, ideally derived from merchant context)
	env := "LIVE"

	paymentReq := &domain.PaymentRequest{
		IdempotencyKey:    req.IdempotencyKey,
		MerchantID:        merchantID,
		Environment:       env,
		APIKey:            "",                 // Bypass API key validation since we are S2S via gRPC mTLS
		MerchantReference: req.IdempotencyKey, // Use idem key as ref
		Amount:            req.Amount,
		Currency:          req.Currency,
		CustomerID:        "",
		IPAddress:         "127.0.0.1",
		PaymentMethod:     "TOKEN",
		ProviderID:        uuid.Nil, // Should be resolved in orchestrator
	}

	// Construct a payload hash (simplified)
	payloadHash := "s2s_grpc_" + req.IdempotencyKey

	resp, err := s.orchestrator.ProcessPayment(ctx, paymentReq, payloadHash)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.ExecutePaymentResponse{
		PaymentId: resp.PaymentID.String(),
		Status:    string(resp.Status),
	}, nil
}

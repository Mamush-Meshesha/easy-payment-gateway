package grpc

import (
	"context"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "payment-gateway/fx-service/proto"
	authcontext "payment-gateway/go-grpc-auth"
)

type FxGrpcServer struct {
	pb.UnimplementedFxServiceServer
}

func NewFxGrpcServer() *FxGrpcServer {
	return &FxGrpcServer{}
}

func (s *FxGrpcServer) GetExchangeRate(ctx context.Context, req *pb.GetExchangeRateRequest) (*pb.GetExchangeRateResponse, error) {
	rc, err := authcontext.ExtractRequestContext(ctx)
	if err != nil || rc == nil {
		return nil, status.Error(codes.Unauthenticated, "unauthenticated or missing request context")
	}

	if req.SourceCurrency == "" || req.TargetCurrency == "" {
		return nil, status.Error(codes.InvalidArgument, "source and target currencies are required")
	}

	// Stub: In production this connects to Bloomberg/Fixer or a local Redis cache updated by a worker
	var rate float64 = 1.0

	if req.SourceCurrency == "USD" && req.TargetCurrency == "EUR" {
		rate = 0.92
	} else if req.SourceCurrency == "USD" && req.TargetCurrency == "ETB" {
		rate = 57.50
	} else if req.SourceCurrency == "EUR" && req.TargetCurrency == "USD" {
		rate = 1.09
	}

	return &pb.GetExchangeRateResponse{
		Rate:      rate,
		Timestamp: time.Now().Unix(),
		Provider:  "mock-fx-provider",
	}, nil
}

func (s *FxGrpcServer) LockExchangeRate(ctx context.Context, req *pb.LockExchangeRateRequest) (*pb.LockExchangeRateResponse, error) {
	rc, err := authcontext.ExtractRequestContext(ctx)
	if err != nil || rc == nil {
		return nil, status.Error(codes.Unauthenticated, "unauthenticated or missing request context")
	}

	// Dynamic Currency Conversion (DCC) lock logic
	resp, err := s.GetExchangeRate(ctx, &pb.GetExchangeRateRequest{
		SourceCurrency: req.SourceCurrency,
		TargetCurrency: req.TargetCurrency,
	})
	if err != nil {
		return nil, err
	}

	// Lock the rate for 15 minutes
	lockId := "fxlock_" + uuid.New().String()
	expiresAt := time.Now().Add(15 * time.Minute).Unix()

	// In production, we'd store `lockId -> rate` in Redis here.

	return &pb.LockExchangeRateResponse{
		LockId:    lockId,
		Rate:      resp.Rate,
		ExpiresAt: expiresAt,
	}, nil
}

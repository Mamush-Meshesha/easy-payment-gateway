package grpc

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	authcontext "payment-gateway/go-grpc-auth"
	pb "payment-gateway/routing-service/proto"
)

type RoutingGrpcServer struct {
	pb.UnimplementedRoutingServiceServer
}

func NewRoutingGrpcServer() *RoutingGrpcServer {
	return &RoutingGrpcServer{}
}

func (s *RoutingGrpcServer) DetermineRoute(ctx context.Context, req *pb.DetermineRouteRequest) (*pb.DetermineRouteResponse, error) {
	rc, err := authcontext.ExtractRequestContext(ctx)
	if err != nil || rc == nil {
		return nil, status.Error(codes.Unauthenticated, "unauthenticated or missing request context")
	}

	if req.Bin == "" {
		return nil, status.Error(codes.InvalidArgument, "BIN is required")
	}

	// Dynamic Routing Logic Stub
	// In production, this would query a BIN database (like binlist) and evaluate historical provider success rates via reporting-service data.
	
	providerId := "telebirr" // Default to telebirr
	reason := "default_route"
	var estimatedFee int32 = 100 // Example fee: 1.00

	if req.Currency == "USD" || req.Currency == "EUR" {
		providerId = "stripe"
		reason = "currency_optimized_routing"
		estimatedFee = 250 // Example fee: 2.50
	} else if req.Currency == "ETB" {
		providerId = "cbebirr" // Switch to CBE Birr or Telebirr depending on BIN or random heuristic for testing
		reason = "local_acquirer_routing"
		estimatedFee = 50 // Example fee: 0.50
	}

	return &pb.DetermineRouteResponse{
		ProviderId:   providerId,
		RouteReason:  reason,
		EstimatedFee: estimatedFee,
	}, nil
}

package grpcserver

import (
	"context"
	"log"
	"net"
	"os"

	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"

	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/settlement-service/internal/domain"
	pb "payment-gateway/settlement-service/proto"
)

type SettlementReadGrpcServer struct {
	pb.UnimplementedSettlementReadServiceServer
	repo domain.PayoutRepository
}

func NewSettlementReadGrpcServer(repo domain.PayoutRepository) *SettlementReadGrpcServer {
	return &SettlementReadGrpcServer{repo: repo}
}

// Ensure the interface has GetPayoutsPaginated and CountPayouts before implementing GetSettlements!
func (s *SettlementReadGrpcServer) GetSettlements(ctx context.Context, req *pb.GetSettlementsRequest) (*pb.GetSettlementsResponse, error) {
	if err := grpcauth.RequireMerchant(ctx, req.MerchantId); err != nil {
		return nil, status.Error(codes.PermissionDenied, "unauthorized access to merchant data")
	}

	merchantID, err := uuid.Parse(req.MerchantId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid merchant id")
	}

	limit := int(req.Limit)
	if limit == 0 {
		limit = 50
	}
	offset := int(req.Offset)

	payouts, err := s.repo.GetPayoutsPaginated(ctx, merchantID, limit, offset)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get settlements")
	}

	total, err := s.repo.CountPayouts(ctx, merchantID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to count settlements")
	}

	var pbSettlements []*pb.Settlement
	for _, p := range payouts {
		pbSettlements = append(pbSettlements, &pb.Settlement{
			Id:                 p.ID.String(),
			MerchantId:         p.MerchantID.String(),
			Amount:             p.Amount,
			Currency:           p.Currency,
			Status:             string(p.Status),
			DestinationAccount: p.DestinationToken,
			CreatedAt:          p.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:          p.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return &pb.GetSettlementsResponse{
		Settlements: pbSettlements,
		Total:       int32(total),
	}, nil
}

func StartGrpcServer(repo domain.PayoutRepository, port string) {
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	caCert := os.Getenv("MTLS_CA_CERT")
	serverCert := os.Getenv("MTLS_SERVER_CERT")
	serverKey := os.Getenv("MTLS_SERVER_KEY")

	creds, err := grpcauth.LoadServerTLSCredentials(caCert, serverCert, serverKey)
	if err != nil {
		log.Fatalf("failed to load mTLS credentials for settlement gRPC server: %v", err)
	}

	s := grpc.NewServer(
		grpc.Creds(creds),
		grpc.UnaryInterceptor(grpcauth.AuthInterceptor(grpcauth.GlobalPolicy)),
	)

	pb.RegisterSettlementReadServiceServer(s, NewSettlementReadGrpcServer(repo))
	reflection.Register(s)

	log.Printf("Settlement Read gRPC server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

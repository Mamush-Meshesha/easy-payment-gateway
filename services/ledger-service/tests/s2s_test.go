package tests

import (
	"context"
	"net"
	"testing"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	grpcauth "payment-gateway/go-grpc-auth"
	pb "payment-gateway/ledger-service/proto"
)

type mockLedgerServer struct {
	pb.UnimplementedLedgerServiceServer
}

func (m *mockLedgerServer) ReserveFunds(ctx context.Context, req *pb.ReserveFundsRequest) (*pb.ReserveFundsResponse, error) {
	return &pb.ReserveFundsResponse{Status: "RESERVED"}, nil
}

func TestNegativeS2SSecurity(t *testing.T) {
	// 1. Start Local gRPC Server with mTLS and S2S Auth Interceptor
	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	defer lis.Close()
	target := lis.Addr().String()

	credsServer, err := grpcauth.LoadServerTLSCredentials(
		"../../../infra/certs/ca.crt",
		"../../../infra/certs/ledger-service.crt",
		"../../../infra/certs/ledger-service.key",
	)
	if err != nil {
		t.Fatalf("failed to load server creds: %v", err)
	}

	grpcServer := grpc.NewServer(
		grpc.Creds(credsServer),
		grpc.UnaryInterceptor(grpcauth.AuthInterceptor(grpcauth.GlobalPolicy)),
	)
	pb.RegisterLedgerServiceServer(grpcServer, &mockLedgerServer{})
	go grpcServer.Serve(lis)
	defer grpcServer.Stop()

	// 2. Test Cases
	t.Run("Valid Caller (settlement-service) should be allowed to ReserveFunds", func(t *testing.T) {
		creds, err := grpcauth.LoadTLSCredentials(
			"../../../infra/certs/ca.crt",
			"../../../infra/certs/settlement-service.crt",
			"../../../infra/certs/settlement-service.key",
		)
		if err != nil {
			t.Fatalf("failed to load credentials: %v", err)
		}

		conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds), grpc.WithAuthority("ledger-service"))
		if err != nil {
			t.Fatalf("did not connect: %v", err)
		}
		defer conn.Close()

		client := pb.NewLedgerServiceClient(conn)
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()

		_, err = client.ReserveFunds(ctx, &pb.ReserveFundsRequest{
			MerchantId: "test",
		})
		
		if err != nil {
			if st, ok := status.FromError(err); ok {
				if st.Code() == codes.PermissionDenied || st.Code() == codes.Unauthenticated {
					t.Fatalf("Expected permission ALLOWED, got %v", st.Code())
				}
			}
		}
	})

	t.Run("Rogue Caller (reporting-service) should be DENIED to ReserveFunds", func(t *testing.T) {
		creds, err := grpcauth.LoadTLSCredentials(
			"../../../infra/certs/ca.crt",
			"../../../infra/certs/reporting-service.crt",
			"../../../infra/certs/reporting-service.key",
		)
		if err != nil {
			t.Fatalf("failed to load credentials: %v", err)
		}

		conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds), grpc.WithAuthority("ledger-service"))
		if err != nil {
			t.Fatalf("did not connect: %v", err)
		}
		defer conn.Close()

		client := pb.NewLedgerServiceClient(conn)
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()

		_, err = client.ReserveFunds(ctx, &pb.ReserveFundsRequest{
			MerchantId: "test",
		})

		if err == nil {
			t.Fatalf("Expected PERMISSION_DENIED error, got none")
		}

		st, ok := status.FromError(err)
		if !ok || st.Code() != codes.PermissionDenied {
			t.Fatalf("Expected PERMISSION_DENIED, got %v", err)
		}
	})
}

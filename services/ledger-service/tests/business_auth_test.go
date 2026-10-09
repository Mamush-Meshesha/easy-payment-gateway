package tests

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net"
	"testing"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	grpcauth "payment-gateway/go-grpc-auth"
	pb "payment-gateway/ledger-service/proto"
)

// ─── Mock Ledger Server ────────────────────────────────────────────────────────

type mockLedgerWithBusinessAuth struct {
	pb.UnimplementedLedgerServiceServer
}

func (m *mockLedgerWithBusinessAuth) ReserveFunds(ctx context.Context, req *pb.ReserveFundsRequest) (*pb.ReserveFundsResponse, error) {
	// Business Authorization: the authenticated context's merchant must own the requested merchant.
	if err := grpcauth.RequireMerchant(ctx, req.MerchantId); err != nil {
		return nil, status.Errorf(codes.PermissionDenied, "business authorization failed: %v", err)
	}
	return &pb.ReserveFundsResponse{Status: "RESERVED"}, nil
}

func (m *mockLedgerWithBusinessAuth) GetLedgerBalances(ctx context.Context, req *pb.GetLedgerBalancesRequest) (*pb.GetLedgerBalancesResponse, error) {
	if err := grpcauth.RequireMerchant(ctx, req.MerchantId); err != nil {
		return nil, status.Errorf(codes.PermissionDenied, "business authorization failed: %v", err)
	}
	return &pb.GetLedgerBalancesResponse{
		Balances: []*pb.AccountBalance{
			{AccountId: "acc-1", Currency: req.MerchantId + "-ETB", BalanceMinorUnits: 10000},
		},
	}, nil
}

// ─── Test Helpers ─────────────────────────────────────────────────────────────

func buildRequestContext(merchantID, subjectID, authType, callerService string) string {
	ctx := map[string]interface{}{
		"merchantId":     merchantID,
		"subjectId":      subjectID,
		"authType":       authType,
		"callerService":  callerService,
		"contextVersion": 1,
	}
	raw, _ := json.Marshal(ctx)
	return base64.StdEncoding.EncodeToString(raw)
}

func startTestServer(t *testing.T) (string, func()) {
	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}

	creds, err := grpcauth.LoadServerTLSCredentials(
		"../../../infra/certs/ca.crt",
		"../../../infra/certs/ledger-service.crt",
		"../../../infra/certs/ledger-service.key",
	)
	if err != nil {
		t.Fatalf("server creds: %v", err)
	}

	srv := grpc.NewServer(
		grpc.Creds(creds),
		grpc.UnaryInterceptor(grpcauth.AuthInterceptor(grpcauth.GlobalPolicy)),
	)
	pb.RegisterLedgerServiceServer(srv, &mockLedgerWithBusinessAuth{})
	go srv.Serve(lis)
	return lis.Addr().String(), func() { srv.Stop(); lis.Close() }
}

func dialAs(t *testing.T, target, service string) *grpc.ClientConn {
	creds, err := grpcauth.LoadTLSCredentials(
		"../../../infra/certs/ca.crt",
		"../../../infra/certs/"+service+".crt",
		"../../../infra/certs/"+service+".key",
	)
	if err != nil {
		t.Fatalf("client creds for %s: %v", service, err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds), grpc.WithAuthority("ledger-service"))
	if err != nil {
		t.Fatalf("dial as %s: %v", service, err)
	}
	return conn
}

func ctxWith(t *testing.T, reqCtxEncoded string) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	md := metadata.Pairs(grpcauth.RequestContextMetadataKey, reqCtxEncoded)
	return metadata.NewOutgoingContext(ctx, md), cancel
}

// ─── Tests ────────────────────────────────────────────────────────────────────

func TestBusinessAuthorization(t *testing.T) {
	target, cleanup := startTestServer(t)
	defer cleanup()

	t.Run("User with correct merchant_id can read their own ledger balances", func(t *testing.T) {
		conn := dialAs(t, target, "settlement-service")
		defer conn.Close()
		client := pb.NewLedgerServiceClient(conn)

		reqCtx := buildRequestContext("merchant-A", "user-1", "USER", "settlement-service")
		ctx, cancel := ctxWith(t, reqCtx)
		defer cancel()

		_, err := client.GetLedgerBalances(ctx, &pb.GetLedgerBalancesRequest{MerchantId: "merchant-A"})
		if err != nil {
			t.Fatalf("expected success, got: %v", err)
		}
	})

	t.Run("User from merchant-A is DENIED access to merchant-B ledger balances", func(t *testing.T) {
		conn := dialAs(t, target, "settlement-service")
		defer conn.Close()
		client := pb.NewLedgerServiceClient(conn)

		reqCtx := buildRequestContext("merchant-A", "user-1", "USER", "settlement-service")
		ctx, cancel := ctxWith(t, reqCtx)
		defer cancel()

		_, err := client.GetLedgerBalances(ctx, &pb.GetLedgerBalancesRequest{MerchantId: "merchant-B"})
		if err == nil {
			t.Fatal("expected PERMISSION_DENIED, got nil error")
		}
		st, ok := status.FromError(err)
		if !ok || st.Code() != codes.PermissionDenied {
			t.Fatalf("expected PERMISSION_DENIED, got: %v", err)
		}
	})

	t.Run("Missing request context is rejected from operations requiring merchant ownership", func(t *testing.T) {
		conn := dialAs(t, target, "settlement-service")
		defer conn.Close()
		client := pb.NewLedgerServiceClient(conn)

		// No RequestContext metadata — plain call
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := client.GetLedgerBalances(ctx, &pb.GetLedgerBalancesRequest{MerchantId: "merchant-A"})
		if err == nil {
			t.Fatal("expected error for missing context, got nil")
		}
		st, ok := status.FromError(err)
		if !ok || (st.Code() != codes.PermissionDenied && st.Code() != codes.Internal) {
			t.Fatalf("expected PermissionDenied or Internal, got: %v", err)
		}
	})

	t.Run("Context spoofing: caller_service in context does not match SPIFFE identity", func(t *testing.T) {
		conn := dialAs(t, target, "settlement-service")
		defer conn.Close()
		client := pb.NewLedgerServiceClient(conn)

		// Claims to be payment-service (spoofed), but TLS cert is settlement-service
		reqCtx := buildRequestContext("merchant-A", "user-1", "USER", "payment-service")
		ctx, cancel := ctxWith(t, reqCtx)
		defer cancel()

		_, err := client.ReserveFunds(ctx, &pb.ReserveFundsRequest{MerchantId: "merchant-A"})
		if err == nil {
			t.Fatal("expected PERMISSION_DENIED for spoofed caller_service, got nil")
		}
		st, ok := status.FromError(err)
		if !ok || st.Code() != codes.PermissionDenied {
			t.Fatalf("expected PERMISSION_DENIED (spoofing), got: %v", err)
		}
	})

	t.Run("Unauthorized S2S caller (reporting-service) is DENIED", func(t *testing.T) {
		conn := dialAs(t, target, "reporting-service")
		defer conn.Close()
		client := pb.NewLedgerServiceClient(conn)

		reqCtx := buildRequestContext("merchant-A", "system", "SYSTEM", "reporting-service")
		ctx, cancel := ctxWith(t, reqCtx)
		defer cancel()

		_, err := client.ReserveFunds(ctx, &pb.ReserveFundsRequest{MerchantId: "merchant-A"})
		if err == nil {
			t.Fatal("expected PERMISSION_DENIED for unauthorized S2S caller")
		}
		st, ok := status.FromError(err)
		if !ok || st.Code() != codes.PermissionDenied {
			t.Fatalf("expected PERMISSION_DENIED, got: %v", err)
		}
	})
}

package grpc

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	authcontext "payment-gateway/go-grpc-auth"
	"payment-gateway/vault-service/internal/kms"
	pb "payment-gateway/vault-service/proto"
)

type VaultGrpcServer struct {
	pb.UnimplementedVaultServiceServer
}

func NewVaultGrpcServer() *VaultGrpcServer {
	return &VaultGrpcServer{}
}

// TokenizeCard accepts raw card data and returns a safe token
func (s *VaultGrpcServer) TokenizeCard(ctx context.Context, req *pb.TokenizeCardRequest) (*pb.TokenizeCardResponse, error) {
	// The caller's identity is already authenticated via mTLS and injected by the AuthInterceptor
	rc, err := authcontext.ExtractRequestContext(ctx)
	if err != nil || rc == nil {
		return nil, status.Error(codes.Unauthenticated, "unauthenticated or missing request context")
	}

	if req.Pan == "" {
		return nil, status.Error(codes.InvalidArgument, "PAN is required")
	}

	// Clean PAN
	pan := strings.ReplaceAll(req.Pan, " ", "")
	pan = strings.ReplaceAll(pan, "-", "")

	if len(pan) < 13 || len(pan) > 19 {
		return nil, status.Error(codes.InvalidArgument, "invalid PAN length")
	}

	// Create JSON payload to vault
	payload := map[string]string{
		"pan":       pan,
		"exp_month": req.ExpMonth,
		"exp_year":  req.ExpYear,
		"cvv":       req.Cvv,
	}
	payloadBytes, _ := json.Marshal(payload)

	// Encrypt using KMS
	encrypted, err := kms.Encrypt(string(payloadBytes))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to encrypt card data")
	}

	// TODO: In a real system, we persist the token -> encrypted mapping to a dedicated postgres instance.
	// For this Phase 20 rollout and to unblock integration, we are storing the encrypted payload *inside* the token.
	// E.g., tok_123_base64(...)
	// We will just return the encrypted payload as part of the token for a truly stateless vault for now.
	statelessToken := fmt.Sprintf("tok_%s.%s", uuid.New().String()[:8], encrypted)

	last4 := pan[len(pan)-4:]
	brand := determineBrand(pan)

	return &pb.TokenizeCardResponse{
		Token: statelessToken,
		Last4: last4,
		Brand: brand,
	}, nil
}

// DetokenizeCard accepts a token and returns the raw PAN.
func (s *VaultGrpcServer) DetokenizeCard(ctx context.Context, req *pb.DetokenizeCardRequest) (*pb.DetokenizeCardResponse, error) {
	rc, err := authcontext.ExtractRequestContext(ctx)
	if err != nil || rc == nil {
		return nil, status.Error(codes.Unauthenticated, "unauthenticated or missing request context")
	}

	// STRICT AUTHORIZATION: ONLY provider-service can detokenize!
	if rc.CallerService != "provider-service" {
		return nil, status.Error(codes.PermissionDenied, "only provider-service can detokenize cards")
	}

	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	parts := strings.Split(req.Token, ".")
	if len(parts) != 2 || !strings.HasPrefix(parts[0], "tok_") {
		return nil, status.Error(codes.InvalidArgument, "invalid token format")
	}

	encrypted := parts[1]
	decrypted, err := kms.Decrypt(encrypted)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid or corrupted token")
	}

	var payload map[string]string
	if err := json.Unmarshal([]byte(decrypted), &payload); err != nil {
		return nil, status.Error(codes.Internal, "failed to parse detokenized payload")
	}

	return &pb.DetokenizeCardResponse{
		Pan:      payload["pan"],
		ExpMonth: payload["exp_month"],
		ExpYear:  payload["exp_year"],
		Cvv:      payload["cvv"],
	}, nil
}

func determineBrand(pan string) string {
	if strings.HasPrefix(pan, "4") {
		return "visa"
	} else if strings.HasPrefix(pan, "5") {
		return "mastercard"
	} else if strings.HasPrefix(pan, "34") || strings.HasPrefix(pan, "37") {
		return "amex"
	}
	return "unknown"
}

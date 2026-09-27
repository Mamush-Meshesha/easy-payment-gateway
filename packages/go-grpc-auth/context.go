package grpcauth

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"

	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/encoding/protojson"

	pb "payment-gateway/go-grpc-auth/proto"
)

const (
	RequestContextMetadataKey = "x-request-context"
)

type contextKey struct{}

var reqContextKey = contextKey{}

// ExtractRequestContext extracts and parses the RequestContext from gRPC metadata.
// Returns nil if no context is found (allowable for some S2S operations if policy allows).
func ExtractRequestContext(ctx context.Context) (*pb.RequestContext, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, nil // No metadata
	}

	vals := md.Get(RequestContextMetadataKey)
	if len(vals) == 0 {
		return nil, nil // No context header
	}

	rawContext := vals[0]
	
	// Base64 decode
	decoded, err := base64.StdEncoding.DecodeString(rawContext)
	if err != nil {
		return nil, fmt.Errorf("failed to base64 decode request context: %w", err)
	}

	reqCtx := &pb.RequestContext{}
	if err := protojson.Unmarshal(decoded, reqCtx); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request context JSON: %w", err)
	}

	return reqCtx, nil
}

// InjectRequestContext places the parsed RequestContext into the standard Go context.
func InjectRequestContext(ctx context.Context, reqCtx *pb.RequestContext) context.Context {
	return context.WithValue(ctx, reqContextKey, reqCtx)
}

// GetRequestContext retrieves the injected RequestContext from the standard Go context.
// Handlers should call this to perform Business Authorization.
func GetRequestContext(ctx context.Context) (*pb.RequestContext, bool) {
	val, ok := ctx.Value(reqContextKey).(*pb.RequestContext)
	return val, ok
}

// RequireMerchant is a business authorization helper.
// It explicitly ensures that the caller is authorized to act on behalf of the targetMerchantID.
func RequireMerchant(ctx context.Context, targetMerchantID string) error {
	reqCtx, ok := GetRequestContext(ctx)
	if !ok || reqCtx == nil {
		return errors.New("missing request context for business authorization")
	}

	// SYSTEM/SERVICE contexts might bypass merchant tenant isolation depending on specific rules,
	// but generally, we demand a match if it's a USER context.
	if reqCtx.AuthType == "USER" {
		if reqCtx.MerchantId != targetMerchantID {
			return fmt.Errorf("unauthorized tenant access: user belongs to merchant %s, requested %s", reqCtx.MerchantId, targetMerchantID)
		}
	}
	
	return nil
}

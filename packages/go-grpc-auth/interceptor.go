package grpcauth

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// PolicyFunc defines the authorization logic (e.g. looking up an S2S matrix).
// Returns true if the service is allowed to call the fullMethod.
type PolicyFunc func(identity *Identity, fullMethod string) bool

// AuthInterceptor enforces SPIFFE extraction and S2S authorization.
func AuthInterceptor(policy PolicyFunc) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {

		// 1. Extract and Validate Identity (UNAUTHENTICATED on failure)
		identity, err := ExtractIdentity(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Unauthenticated, "authentication failed: %v", err)
		}

		// 2. Authorization (PERMISSION_DENIED on failure)
		if !policy(identity, info.FullMethod) {
			return nil, status.Errorf(codes.PermissionDenied, "service %s is not authorized to call %s", identity.ServiceName, info.FullMethod)
		}

		// 3. Extract and Validate Request Context (if present)
		reqCtx, err := ExtractRequestContext(ctx)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid request context: %v", err)
		}

		// Spoofing check: if a context is provided, ensure caller_service matches SPIFFE identity
		if reqCtx != nil && reqCtx.CallerService != "" {
			if reqCtx.CallerService != identity.ServiceName {
				return nil, status.Errorf(codes.PermissionDenied, "context spoofing detected: caller service %s does not match SPIFFE identity %s", reqCtx.CallerService, identity.ServiceName)
			}
		}

		// 4. Inject parsed RequestContext into the handler's context for Business Auth
		if reqCtx != nil {
			ctx = InjectRequestContext(ctx, reqCtx)
		}

		return handler(ctx, req)
	}
}

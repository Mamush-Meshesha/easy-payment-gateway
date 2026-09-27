package grpcauth

import (
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"
)

// NewSecureServerOptions returns the gRPC ServerOptions that wire up, in order:
//  1. mTLS transport credentials
//  2. OTel stats handler (extracts trace context from incoming metadata before the interceptor fires)
//  3. AuthInterceptor (S2S SPIFFE + RequestContext extraction + Business Auth helpers)
//
// The OTel stats handler runs at the transport level — before unary interceptors —
// so the span is correctly available in context when the auth interceptor executes.
func NewSecureServerOptions(
	caCertPath, certPath, keyPath string,
	policy PolicyFunc,
) ([]grpc.ServerOption, error) {
	creds, err := LoadServerTLSCredentials(caCertPath, certPath, keyPath)
	if err != nil {
		return nil, err
	}

	return []grpc.ServerOption{
		grpc.Creds(creds),
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.UnaryInterceptor(AuthInterceptor(policy)),
	}, nil
}

// NewSecureClientOptions returns gRPC DialOptions that wire up:
//  1. mTLS client credentials
//  2. OTel stats handler (injects traceparent into outgoing metadata automatically)
func NewSecureClientOptions(
	caCertPath, certPath, keyPath string,
) ([]grpc.DialOption, error) {
	creds, err := LoadTLSCredentials(caCertPath, certPath, keyPath)
	if err != nil {
		return nil, err
	}

	return []grpc.DialOption{
		grpc.WithTransportCredentials(creds),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
	}, nil
}

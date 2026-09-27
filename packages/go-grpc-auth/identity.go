package grpcauth

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"

	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/peer"
)

// Identity represents an authenticated SPIFFE identity.
type Identity struct {
	Environment string
	ServiceName string
}

// ExtractIdentity retrieves and validates the SPIFFE URI from the gRPC context.
func ExtractIdentity(ctx context.Context) (*Identity, error) {
	p, ok := peer.FromContext(ctx)
	if !ok {
		return nil, errors.New("no peer info found in context")
	}

	tlsAuth, ok := p.AuthInfo.(credentials.TLSInfo)
	if !ok {
		return nil, errors.New("peer is not using TLS")
	}

	if len(tlsAuth.State.VerifiedChains) == 0 || len(tlsAuth.State.VerifiedChains[0]) == 0 {
		return nil, errors.New("peer certificate is not verified")
	}

	cert := tlsAuth.State.VerifiedChains[0][0]

	// Extract SPIFFE URI from SAN URIs
	var spiffeURI *url.URL
	for _, u := range cert.URIs {
		if u.Scheme == "spiffe" {
			if spiffeURI != nil {
				return nil, errors.New("multiple SPIFFE URIs found in certificate")
			}
			spiffeURI = u
		}
	}

	if spiffeURI == nil {
		return nil, errors.New("no SPIFFE URI found in certificate SAN")
	}

	// Validate SPIFFE format: spiffe://payment-gateway/ns/<env>/sa/<service>
	if spiffeURI.Host != "payment-gateway" {
		return nil, fmt.Errorf("invalid SPIFFE trust domain: %s", spiffeURI.Host)
	}

	parts := strings.Split(strings.Trim(spiffeURI.Path, "/"), "/")
	if len(parts) != 4 || parts[0] != "ns" || parts[2] != "sa" {
		return nil, fmt.Errorf("invalid SPIFFE path format: %s", spiffeURI.Path)
	}

	env := parts[1]
	service := parts[3]

	return &Identity{
		Environment: env,
		ServiceName: service,
	}, nil
}

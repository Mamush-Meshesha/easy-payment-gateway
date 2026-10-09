package grpcclient

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc"

	grpcauth "payment-gateway/go-grpc-auth"
	pb "payment-gateway/payment-service/proto" // Using the generic proto path defined in Go
	"payment-gateway/webhook-service/internal/domain"
)

var (
	caCert     = os.Getenv("MTLS_CA_CERT")
	clientCert = os.Getenv("MTLS_SERVER_CERT")
	clientKey  = os.Getenv("MTLS_SERVER_KEY")
)

type MerchantGrpcClient struct {
	client pb.MerchantServiceClient
}

func NewMerchantGrpcClient(address string) (*MerchantGrpcClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load client credentials: %w", err)
	}

	conn, err := grpc.Dial(address, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, fmt.Errorf("failed to dial merchant-service: %w", err)
	}

	log.Printf("Connected to Merchant Service at %s", address)
	return &MerchantGrpcClient{
		client: pb.NewMerchantServiceClient(conn),
	}, nil
}

func (c *MerchantGrpcClient) GetWebhookConfig(ctx context.Context, merchantID uuid.UUID, environment string) (*domain.WebhookConfig, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	resp, err := c.client.GetWebhookConfig(ctx, &pb.GetWebhookConfigRequest{
		MerchantId:  merchantID.String(),
		Environment: environment,
	})
	if err != nil {
		return nil, fmt.Errorf("grpc GetWebhookConfig failed: %w", err)
	}

	config := &domain.WebhookConfig{
		URL:           resp.WebhookUrl,
		PrimarySecret: resp.HmacSecret,
	}

	if resp.SecondaryHmacSecret != "" {
		config.SecondarySecret = resp.SecondaryHmacSecret
		if resp.SecondaryHmacExpiresAt != "" {
			t, err := time.Parse(time.RFC3339, resp.SecondaryHmacExpiresAt)
			if err == nil {
				config.SecondaryExpiresAt = &t
			}
		}
	}

	return config, nil
}

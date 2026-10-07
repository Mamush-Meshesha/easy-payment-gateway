package grpcclient

import (
	"context"
	"fmt"
	"os"

	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	grpcauth "payment-gateway/go-grpc-auth"
	pb "payment-gateway/payment-service/proto"
)

var (
	caCert     = os.Getenv("MTLS_CA_CERT")
	clientCert = os.Getenv("MTLS_SERVER_CERT")
	clientKey  = os.Getenv("MTLS_SERVER_KEY")
)

type PaymentClientImpl struct {
	client pb.PaymentWriteServiceClient
}

func NewPaymentClient(target string) (*PaymentClientImpl, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, err
	}
	return &PaymentClientImpl{
		client: pb.NewPaymentWriteServiceClient(conn),
	}, nil
}

func (c *PaymentClientImpl) ExecutePayment(merchantID, paymentMethodID uuid.UUID, amount int64, currency string, idempotencyKey string) (*uuid.UUID, error) {
	// Construct an internal S2S context using metadata
	md := metadata.Pairs(
		"x-merchant-id", merchantID.String(),
		"x-caller-service", "billing-service",
		"x-roles", "SUPER_ADMIN", // Assume billing has admin rights to trigger payments
	)
	ctx := metadata.NewOutgoingContext(context.Background(), md)

	req := &pb.ExecutePaymentRequest{
		MerchantId:      merchantID.String(),
		PaymentMethodId: paymentMethodID.String(),
		Amount:          amount,
		Currency:        currency,
		IdempotencyKey:  idempotencyKey,
	}

	resp, err := c.client.ExecutePayment(ctx, req)
	if err != nil {
		return nil, err
	}

	pid, err := uuid.Parse(resp.PaymentId)
	if err != nil {
		return nil, err
	}

	return &pid, nil
}

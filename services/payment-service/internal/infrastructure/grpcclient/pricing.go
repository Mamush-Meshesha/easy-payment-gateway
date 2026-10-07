package grpcclient

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc"

	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/payment-service/internal/domain"
	pbPricing "payment-gateway/pricing-service/pb"
)

type PricingClientImpl struct {
	client pbPricing.PricingServiceClient
}

func NewPricingClient(target string) (domain.PricingClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, err
	}
	return &PricingClientImpl{client: pbPricing.NewPricingServiceClient(conn)}, nil
}

func (c *PricingClientImpl) CalculateFee(ctx context.Context, merchantID uuid.UUID, paymentMethod string, amount int64, currency string) (*domain.PricingResponse, error) {
	req := &pbPricing.CalculateFeeRequest{
		MerchantId:    merchantID.String(),
		PaymentMethod: paymentMethod,
		Amount:        amount,
		Currency:      currency,
	}

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	res, err := c.client.CalculateFee(ctxWithTimeout, req)
	if err != nil {
		return nil, err
	}

	return &domain.PricingResponse{
		TotalFee:     res.TotalFee,
		PlatformCut:  res.PlatformCut,
		MerchantCut:  res.MerchantCut,
		AppliedRules: res.AppliedRules,
	}, nil
}

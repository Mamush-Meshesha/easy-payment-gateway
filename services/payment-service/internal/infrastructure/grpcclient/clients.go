package grpcclient

import (
	"context"
	"fmt"
	"os"
	grpcauth "payment-gateway/go-grpc-auth"
	pbLedger "payment-gateway/ledger-service/proto"
	"payment-gateway/payment-service/internal/domain"
	pbMerchant "payment-gateway/payment-service/proto"
	pbProvider "payment-gateway/provider-service/proto"
	pbRisk "payment-gateway/risk-service/proto"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc"
)

var (
	caCert     = os.Getenv("MTLS_CA_CERT")
	clientCert = os.Getenv("MTLS_SERVER_CERT")
	clientKey  = os.Getenv("MTLS_SERVER_KEY")
)

// --- Merchant Client ---
type MerchantClientImpl struct {
	client pbMerchant.MerchantServiceClient
}

func NewMerchantClient(target string) (domain.MerchantClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, err
	}
	return &MerchantClientImpl{client: pbMerchant.NewMerchantServiceClient(conn)}, nil
}

func (c *MerchantClientImpl) ValidateApiKey(ctx context.Context, apiKey string) (bool, uuid.UUID, string, error) {
	res, err := c.client.ValidateApiKey(ctx, &pbMerchant.ValidateApiKeyRequest{ApiKey: apiKey})
	if err != nil {
		return false, uuid.Nil, "", err
	}
	if !res.IsValid {
		return false, uuid.Nil, "", nil
	}
	merchID, err := uuid.Parse(res.MerchantId)
	if err != nil {
		return false, uuid.Nil, "", fmt.Errorf("invalid merchant uuid from auth service: %v", err)
	}

	return true, merchID, res.Environment, nil
}

func (c *MerchantClientImpl) GetMerchantConfig(ctx context.Context, merchantID uuid.UUID) (domain.MerchantConfig, error) {
	req := &pbMerchant.GetMerchantConfigRequest{
		MerchantId: merchantID.String(),
	}
	res, err := c.client.GetMerchantConfig(ctx, req)
	if err != nil {
		return domain.MerchantConfig{}, err
	}

	config := domain.MerchantConfig{
		Version:               int(res.Version),
		FeeRouting:            res.FeeRouting,
		EnabledPaymentMethods: res.EnabledPaymentMethods,
	}
	return config, nil
}

func (c *MerchantClientImpl) GetMerchantName(ctx context.Context, merchantID uuid.UUID) (string, error) {
	req := &pbMerchant.GetMerchantRequest{
		MerchantId: merchantID.String(),
	}
	res, err := c.client.GetMerchant(ctx, req)
	if err != nil {
		return "", err
	}
	return res.LegalName, nil
}

// --- Risk Client ---
type RiskClientImpl struct {
	client pbRisk.RiskServiceClient
}

func NewRiskClient(target string) (domain.RiskClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, err
	}
	return &RiskClientImpl{client: pbRisk.NewRiskServiceClient(conn)}, nil
}

func (c *RiskClientImpl) CheckRisk(ctx context.Context, p *domain.Payment) (string, string, bool, error) {
	req := &pbRisk.CheckRiskRequest{
		PaymentId:     p.ID.String(),
		MerchantId:    p.MerchantID.String(),
		Amount:        p.Amount,
		Currency:      p.Currency,
		CustomerId:    p.CustomerID,
		IpAddress:     p.IPAddress,
		PaymentMethod: p.PaymentMethod,
	}
	res, err := c.client.CheckRisk(ctx, req)
	if err != nil {
		return "", "", false, err
	}
	// Note: res.EvaluationStatus could be UNAVAILABLE
	if res.EvaluationStatus != "SUCCESS" {
		return "", "", false, fmt.Errorf("risk evaluation failed with status: %s", res.EvaluationStatus)
	}
	return res.Action, res.Reason, res.Requires_3Ds, nil
}

// --- Provider Client ---
type ProviderClientImpl struct {
	client pbProvider.ProviderServiceClient
}

func NewProviderClient(target string) (domain.ProviderClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, err
	}
	return &ProviderClientImpl{client: pbProvider.NewProviderServiceClient(conn)}, nil
}

func (c *ProviderClientImpl) InitiatePayment(ctx context.Context, paymentID uuid.UUID, providerID uuid.UUID, amount int64, currency string, environment string) (string, error) {
	req := &pbProvider.InitiatePaymentRequest{
		PaymentId:   paymentID.String(),
		ProviderId:  providerID.String(),
		Amount:      amount,
		Currency:    currency,
		Environment: environment,
	}

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	res, err := c.client.InitiatePayment(ctxWithTimeout, req)
	if err != nil {
		// gRPC Timeout or Unavailability
		return "TIMEOUT", err
	}
	return res.Status, nil
}

func (c *ProviderClientImpl) InitiateRefund(ctx context.Context, refundID uuid.UUID, providerID uuid.UUID, amount int64, currency string, originalProviderID *string, environment string) (string, error) {
	req := &pbProvider.InitiateRefundRequest{
		RefundId:    refundID.String(),
		ProviderId:  providerID.String(),
		Amount:      amount,
		Currency:    currency,
		Environment: environment,
	}
	if originalProviderID != nil {
		req.OriginalProviderId = originalProviderID
	}

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	res, err := c.client.InitiateRefund(ctxWithTimeout, req)
	if err != nil {
		return "TIMEOUT", err
	}
	return res.Status, nil
}

// --- Ledger Client ---
type LedgerClientImpl struct {
	client pbLedger.LedgerServiceClient
}

func NewLedgerClient(target string) (domain.LedgerClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, err
	}
	return &LedgerClientImpl{client: pbLedger.NewLedgerServiceClient(conn)}, nil
}

func (c *LedgerClientImpl) RecordJournalEntry(ctx context.Context, paymentID uuid.UUID, providerID string, providerTransactionID string, amount int64, merchantCut int64, platformCut int64, currency string, environment string) (string, error) {
	req := &pbLedger.RecordJournalEntryRequest{
		ReferenceType:         "PAYMENT",
		ReferenceId:           paymentID.String(),
		ProviderId:            providerID,
		ProviderTransactionId: providerTransactionID,
		Currency:              currency,
		Environment:           environment,
		Lines: []*pbLedger.JournalLineRequest{
			{
				AccountId: "11111111-1111-1111-1111-111111111111", // Provider Receivable
				Amount:    amount,
				Direction: "DEBIT",
			},
			{
				AccountId: "22222222-2222-2222-2222-222222222222", // Merchant Payable
				Amount:    merchantCut,
				Direction: "CREDIT",
			},
			{
				AccountId: "33333333-3333-3333-3333-333333333333", // Platform Fee
				Amount:    platformCut,
				Direction: "CREDIT",
			},
		},
	}
	ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	res, err := c.client.RecordJournalEntry(ctxWithTimeout, req)
	if err != nil {
		return "TIMEOUT", err
	}
	if !res.Success {
		return "TIMEOUT", fmt.Errorf("ledger error: %s", res.Error)
	}
	return "COMMITTED", nil
}

func (c *LedgerClientImpl) RecordRefundJournalEntry(ctx context.Context, refundID uuid.UUID, paymentID uuid.UUID, amount int64, currency string, environment string) (string, error) {
	req := &pbLedger.RecordJournalEntryRequest{
		ReferenceType: "REFUND",
		ReferenceId:   refundID.String(),
		Currency:      currency,
		Environment:   environment,
		Lines: []*pbLedger.JournalLineRequest{
			{
				AccountId: "11111111-1111-1111-1111-111111111111",
				Amount:    amount,
				Direction: "DEBIT",
			},
			{
				AccountId: "22222222-2222-2222-2222-222222222222",
				Amount:    amount,
				Direction: "CREDIT",
			},
		},
	}
	ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	res, err := c.client.RecordJournalEntry(ctxWithTimeout, req)
	if err != nil {
		return "TIMEOUT", err
	}
	if !res.Success {
		return "TIMEOUT", fmt.Errorf("ledger error: %s", res.Error)
	}
	return "COMMITTED", nil
}

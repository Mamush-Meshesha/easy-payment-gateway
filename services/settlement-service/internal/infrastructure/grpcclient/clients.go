package grpcclient

import (
	"context"
	"fmt"
	"os"
	grpcauth "payment-gateway/go-grpc-auth"
	pbLedger "payment-gateway/ledger-service/proto"
	pbMerchant "payment-gateway/payment-service/proto"
	"payment-gateway/settlement-service/internal/domain"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc"
)

var (
	caCert     = os.Getenv("MTLS_CA_CERT")
	clientCert = os.Getenv("MTLS_SERVER_CERT")
	clientKey  = os.Getenv("MTLS_SERVER_KEY")
)

// --- Ledger Client ---

type LedgerClientImpl struct {
	client pbLedger.LedgerServiceClient
}

func NewLedgerClient(target string) (domain.LedgerClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load ledger client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, fmt.Errorf("failed to dial ledger service: %w", err)
	}
	return &LedgerClientImpl{client: pbLedger.NewLedgerServiceClient(conn)}, nil
}

func (c *LedgerClientImpl) ReserveFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	resp, err := c.client.ReserveFunds(ctx, &pbLedger.ReserveFundsRequest{
		MerchantId:  merchantID.String(),
		Currency:    currency,
		Amount:      amount,
		ReferenceId: referenceID,
	})
	if err != nil {
		return fmt.Errorf("ledger ReserveFunds rpc failed: %w", err)
	}
	// Ledger returns "RESERVED" on success
	if resp.Status != "RESERVED" {
		return fmt.Errorf("ledger ReserveFunds returned unexpected status: %s", resp.Status)
	}
	return nil
}

func (c *LedgerClientImpl) ReleaseReservedFunds(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	resp, err := c.client.ReleaseReservedFunds(ctx, &pbLedger.ReleaseReservedFundsRequest{
		MerchantId:          merchantID.String(),
		Currency:            currency,
		Amount:              amount,
		OriginalReferenceId: referenceID,
	})
	if err != nil {
		return fmt.Errorf("ledger ReleaseReservedFunds rpc failed: %w", err)
	}
	// Ledger returns "RELEASED" on success
	if resp.Status != "RELEASED" {
		return fmt.Errorf("ledger ReleaseReservedFunds returned unexpected status: %s", resp.Status)
	}
	return nil
}

func (c *LedgerClientImpl) CompleteSettlement(ctx context.Context, merchantID uuid.UUID, currency string, amount int64, referenceID string) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	resp, err := c.client.CompleteSettlement(ctx, &pbLedger.CompleteSettlementRequest{
		MerchantId:          merchantID.String(),
		Currency:            currency,
		Amount:              amount,
		OriginalReferenceId: referenceID,
	})
	if err != nil {
		return fmt.Errorf("ledger CompleteSettlement rpc failed: %w", err)
	}
	// Ledger returns "COMPLETED" on success
	if resp.Status != "COMPLETED" {
		return fmt.Errorf("ledger CompleteSettlement returned unexpected status: %s", resp.Status)
	}
	return nil
}

// --- Merchant Client ---

type MerchantClientImpl struct {
	client pbMerchant.MerchantServiceClient
}

func NewMerchantClient(target string) (domain.MerchantClient, error) {
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		return nil, fmt.Errorf("failed to load merchant client credentials: %w", err)
	}
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, fmt.Errorf("failed to dial merchant service: %w", err)
	}
	return &MerchantClientImpl{client: pbMerchant.NewMerchantServiceClient(conn)}, nil
}

func (c *MerchantClientImpl) GetPayoutDestination(ctx context.Context, merchantID uuid.UUID, currency string) (string, string, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	resp, err := c.client.GetPayoutDestination(ctx, &pbMerchant.GetPayoutDestinationRequest{
		MerchantId: merchantID.String(),
		Currency:   currency,
	})
	if err != nil {
		return "", "", fmt.Errorf("merchant GetPayoutDestination rpc failed: %w", err)
	}
	// Proto returns destination_token (tokenized account ref) and destination_bank
	if resp.DestinationToken == "" || resp.DestinationBank == "" {
		return "", "", fmt.Errorf("merchant %s has no payout destination configured for %s", merchantID, currency)
	}
	return resp.DestinationToken, resp.DestinationBank, nil
}

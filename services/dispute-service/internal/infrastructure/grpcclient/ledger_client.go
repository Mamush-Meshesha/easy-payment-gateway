package grpcclient

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc"

	grpcauth "payment-gateway/go-grpc-auth"
	pbLedger "payment-gateway/ledger-service/proto"
)

var (
	caCert     = os.Getenv("MTLS_CA_CERT")
	clientCert = os.Getenv("MTLS_SERVER_CERT")
	clientKey  = os.Getenv("MTLS_SERVER_KEY")
)

type LedgerClientImpl struct {
	client pbLedger.LedgerServiceClient
}

func NewLedgerClient(target string) (*LedgerClientImpl, error) {
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

// FreezeDisputeFunds holds the funds in a Frozen Dispute account (debiting available balance)
func (c *LedgerClientImpl) FreezeDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := &pbLedger.RecordJournalEntryRequest{
		ReferenceType: "DISPUTE_FREEZE",
		ReferenceId:   paymentID.String(),
		Currency:      currency,
		Environment:   "LIVE", // Simplifying for now
		Lines: []*pbLedger.JournalLineRequest{
			{
				AccountId: "22222222-2222-2222-2222-222222222222",
				Amount:    amount,
				Direction: "DEBIT",
			},
			{
				AccountId: "44444444-4444-4444-4444-444444444444",
				Amount:    amount,
				Direction: "CREDIT",
			},
		},
	}

	res, err := c.client.RecordJournalEntry(ctx, req)
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("ledger error: %s", res.Error)
	}
	return nil
}

func (c *LedgerClientImpl) ReleaseDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := &pbLedger.RecordJournalEntryRequest{
		ReferenceType: "DISPUTE_RELEASE",
		ReferenceId:   paymentID.String(),
		Currency:      currency,
		Environment:   "LIVE",
		Lines: []*pbLedger.JournalLineRequest{
			{
				AccountId: "44444444-4444-4444-4444-444444444444",
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

	res, err := c.client.RecordJournalEntry(ctx, req)
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("ledger error: %s", res.Error)
	}
	return nil
}

func (c *LedgerClientImpl) ReverseDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := &pbLedger.RecordJournalEntryRequest{
		ReferenceType: "DISPUTE_REVERSAL",
		ReferenceId:   paymentID.String(),
		Currency:      currency,
		Environment:   "LIVE",
		Lines: []*pbLedger.JournalLineRequest{
			{
				AccountId: "44444444-4444-4444-4444-444444444444",
				Amount:    amount,
				Direction: "DEBIT",
			},
			{
				AccountId: "11111111-1111-1111-1111-111111111111", // Simulating money leaving back to Provider
				Amount:    amount,
				Direction: "CREDIT",
			},
		},
	}

	res, err := c.client.RecordJournalEntry(ctx, req)
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("ledger error: %s", res.Error)
	}
	return nil
}

package grpcclient

import (
	"context"
	"fmt"
	"os"
	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/reconciliation-service/internal/domain"
	pbLedger "payment-gateway/ledger-service/proto"

	"google.golang.org/grpc"
)

var (
	caCert     = os.Getenv("MTLS_CA_CERT")
	clientCert = os.Getenv("MTLS_SERVER_CERT")
	clientKey  = os.Getenv("MTLS_SERVER_KEY")
)

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

func (c *LedgerClientImpl) GetLedgerEntriesByReferences(ctx context.Context, providerID string, providerTxIDs []string) ([]domain.LedgerEntry, error) {
	req := &pbLedger.GetLedgerEntriesRequest{
		ProviderId:             providerID,
		ProviderTransactionIds: providerTxIDs,
	}

	resp, err := c.client.GetLedgerEntriesByReferences(ctx, req)
	if err != nil {
		return nil, err
	}

	var entries []domain.LedgerEntry
	for _, entry := range resp.Entries {
		entries = append(entries, domain.LedgerEntry{
			JournalEntryID:        entry.JournalEntryId,
			ReferenceType:         entry.ReferenceType,
			ReferenceID:           entry.ReferenceId,
			ProviderID:            entry.ProviderId,
			ProviderTransactionID: entry.ProviderTransactionId,
			Amount:                entry.Amount,
			Currency:              entry.Currency,
			EffectiveAt:           entry.EffectiveAt,
		})
	}

	return entries, nil
}

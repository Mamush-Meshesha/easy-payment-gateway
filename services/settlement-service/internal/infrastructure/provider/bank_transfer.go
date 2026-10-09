package provider

import (
	"context"
	"log"
	"payment-gateway/settlement-service/internal/domain"
)

// BankTransferProvider is a stub implementation of domain.PayoutProvider.
// In production this would call the actual bank's API (e.g., EthSwitch or CBE).
// Per production rules: unknown provider outcome MUST be treated as UNKNOWN — never fabricate SUCCESS.
type BankTransferProvider struct{}

func NewBankTransferProvider() domain.PayoutProvider {
	return &BankTransferProvider{}
}

func (p *BankTransferProvider) InitiatePayout(ctx context.Context, req domain.PayoutRequest) (domain.PayoutResult, error) {
	// No real bank integration is wired yet.
	// Returning UNKNOWN is the ONLY production-safe response here — we cannot assume
	// success or failure without an authoritative provider response.
	log.Printf("[BankTransferProvider] Payout stub called: referenceID=%s amount=%d currency=%s destinationToken=%s bank=%s — returning UNKNOWN (not yet integrated)",
		req.ReferenceID, req.Amount, req.Currency, req.DestinationToken, req.DestinationBank)
	return domain.PayoutResult{
		Status:            domain.ProviderStatusUnknown,
		ProviderReference: "",
	}, nil
}

func (p *BankTransferProvider) GetPayoutStatus(ctx context.Context, reference string) (domain.PayoutResult, error) {
	log.Printf("[BankTransferProvider] GetPayoutStatus stub called: reference=%s — returning UNKNOWN (not yet integrated)", reference)
	return domain.PayoutResult{
		Status:            domain.ProviderStatusUnknown,
		ProviderReference: reference,
	}, nil
}

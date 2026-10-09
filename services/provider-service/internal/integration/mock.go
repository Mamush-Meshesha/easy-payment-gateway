package integration

import (
	"context"
	"log"
	"payment-gateway/provider-service/internal/domain"
)

type MockProviderAdapter struct{}

func NewMockProviderAdapter() domain.ProviderAdapter {
	return &MockProviderAdapter{}
}

func (a *MockProviderAdapter) InitiatePayment(ctx context.Context, paymentID string, amount int64, currency string, environment string) (string, error) {
	log.Printf("[MOCK PROVIDER] Initiating payment request for PaymentID=%s, Amount=%d, Currency=%s (Environment: %s)\n", paymentID, amount, currency, environment)
	// Simulate success for mock provider
	return "SUCCESS", nil // Could be PENDING to trigger webhook simulation
}

func (a *MockProviderAdapter) InitiateRefund(ctx context.Context, refundID string, amount int64, currency string, environment string) (string, error) {
	log.Printf("[MOCK PROVIDER] Initiating refund request for RefundID=%s, Amount=%d, Currency=%s (Environment: %s)\n", refundID, amount, currency, environment)
	// Simulate success for mock provider
	return "SUCCESS", nil
}

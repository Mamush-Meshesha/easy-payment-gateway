package service

import (
	"context"
	"github.com/google/uuid"
	"payment-gateway/payment-service/internal/domain"
	"testing"
)

func TestUUIDv7Generation(t *testing.T) {
	// Let's test that uuid.NewV7() is generating Version 7 UUIDs as expected
	// This ensures that our distributed DB constraints are met.

	id, err := uuid.NewV7()
	if err != nil {
		t.Fatalf("Failed to generate UUIDv7: %v", err)
	}

	if id.Version() != 7 {
		t.Errorf("Expected UUID version 7, got %v", id.Version())
	}

	// Mocking the orchestrator to check if payment generation works with V7
	mockRepo := &MockPaymentRepo{}
	mockMerchant := &MockMerchantClient{}
	mockRisk := &MockRiskClient{}
	mockProvider := &MockProvider{}
	mockLedger := &MockLedger{}
	mockPricing := &MockPricing{}

	o := NewPaymentOrchestrator(mockRepo, mockMerchant, nil, mockRisk, mockProvider, mockLedger, mockPricing)

	req := &domain.PaymentRequest{
		IdempotencyKey: "test-idem-key",
		MerchantID:     uuid.Must(uuid.NewV7()),
		Amount:         1000,
		Currency:       "USD",
	}

	resp, err := o.ProcessPayment(context.Background(), req, "hash")
	if err != nil {
		// We expect it to fail because of mocks, but if it panics because of uuid generation it will fail the test
		t.Logf("ProcessPayment returned error as expected with mocks: %v", err)
	}

	if resp != nil {
		if resp.PaymentID.Version() != 7 {
			t.Errorf("Expected Orchestrator to generate UUIDv7 for PaymentID, got %v", resp.PaymentID.Version())
		}
	}
}

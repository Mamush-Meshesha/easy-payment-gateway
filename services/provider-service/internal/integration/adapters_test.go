package integration_test

import (
	"context"
	"testing"

	"payment-gateway/provider-service/internal/integration"
)

func TestCBEBirrAdapter(t *testing.T) {
	adapter := integration.NewCBEBirrAdapter("https://api.cbebirr.example", "appID", "appKey")
	ctx := context.Background()
	paymentID := "pay-cbebirr-123"

	status, err := adapter.InitiatePayment(ctx, paymentID, 100, "ETB", "sandbox")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status != "PENDING" {
		t.Errorf("expected PENDING status, got %s", status)
	}

	status, err = adapter.InitiateRefund(ctx, paymentID, 100, "ETB", "sandbox")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status != "SUCCESS" {
		t.Errorf("expected SUCCESS status, got %s", status)
	}
}

func TestAwashPayAdapter(t *testing.T) {
	adapter := integration.NewAwashPayAdapter("https://api.awashpay.example", "clientID", "secret")
	ctx := context.Background()
	paymentID := "pay-awash-123"

	status, err := adapter.InitiatePayment(ctx, paymentID, 200, "ETB", "sandbox")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status != "PENDING" {
		t.Errorf("expected PENDING status, got %s", status)
	}

	status, err = adapter.InitiateRefund(ctx, paymentID, 200, "ETB", "sandbox")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status != "SUCCESS" {
		t.Errorf("expected SUCCESS status, got %s", status)
	}
}

func TestMPesaAdapter(t *testing.T) {
	adapter := integration.NewMPesaAdapter("https://api.safaricom.example", "consumerKey", "consumerSecret", "passKey")
	ctx := context.Background()
	paymentID := "pay-mpesa-123"

	status, err := adapter.InitiatePayment(ctx, paymentID, 500, "KES", "sandbox")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status != "PENDING" {
		t.Errorf("expected PENDING status, got %s", status)
	}

	status, err = adapter.InitiateRefund(ctx, paymentID, 500, "KES", "sandbox")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status != "SUCCESS" {
		t.Errorf("expected SUCCESS status, got %s", status)
	}
}

func TestTelebirrAdapter_MissingCredentials(t *testing.T) {
	// Without credentials, it should simulate PENDING for MVP
	adapter := integration.NewTelebirrAdapter("https://api.telebirr.example")
	ctx := context.Background()
	paymentID := "pay-telebirr-123"

	status, err := adapter.InitiatePayment(ctx, paymentID, 500, "ETB", "sandbox")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status != "PENDING" {
		t.Errorf("expected PENDING status, got %s", status)
	}
}

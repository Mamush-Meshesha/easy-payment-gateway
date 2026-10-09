package integration

import (
	"context"
	"log"
	"net/http"
	"payment-gateway/provider-service/internal/domain"
)

type CBEBirrConfig struct {
	BaseURL string
	AppID   string
	AppKey  string
}

type CBEBirrAdapter struct {
	config CBEBirrConfig
	client *http.Client
}

func NewCBEBirrAdapter(baseURL, appID, appKey string) domain.ProviderAdapter {
	return &CBEBirrAdapter{
		config: CBEBirrConfig{
			BaseURL: baseURL,
			AppID:   appID,
			AppKey:  appKey,
		},
		client: &http.Client{},
	}
}

func (a *CBEBirrAdapter) InitiatePayment(ctx context.Context, paymentID string, amount int64, currency string, environment string) (string, error) {
	log.Printf("[CBE BIRR] Initiating payment request for PaymentID=%s, Amount=%d, Currency=%s (Environment: %s)\n", paymentID, amount, currency, environment)
	// TODO: Implement actual CBE Birr XML/JSON payload construction and HTTP POST
	// Simulate async flow: CBE Birr usually returns PENDING and requires user to confirm USSD/App
	return "PENDING", nil
}

func (a *CBEBirrAdapter) InitiateRefund(ctx context.Context, refundID string, amount int64, currency string, environment string) (string, error) {
	log.Printf("[CBE BIRR] Initiating refund request for RefundID=%s, Amount=%d, Currency=%s (Environment: %s)\n", refundID, amount, currency, environment)
	// TODO: Implement CBE Birr refund API call
	return "SUCCESS", nil
}

package integration

import (
	"context"
	"log"
	"net/http"
	"payment-gateway/provider-service/internal/domain"
)

type MPesaConfig struct {
	BaseURL        string
	ConsumerKey    string
	ConsumerSecret string
	PassKey        string
}

type MPesaAdapter struct {
	config MPesaConfig
	client *http.Client
}

func NewMPesaAdapter(baseURL, consumerKey, consumerSecret, passKey string) domain.ProviderAdapter {
	return &MPesaAdapter{
		config: MPesaConfig{
			BaseURL:        baseURL,
			ConsumerKey:    consumerKey,
			ConsumerSecret: consumerSecret,
			PassKey:        passKey,
		},
		client: &http.Client{},
	}
}

func (a *MPesaAdapter) InitiatePayment(ctx context.Context, paymentID string, amount int64, currency string, environment string) (string, error) {
	log.Printf("[M-PESA] Initiating Safaricom STK Push for PaymentID=%s, Amount=%d, Currency=%s (Environment: %s)\n", paymentID, amount, currency, environment)
	// TODO: Implement M-Pesa Daraja API (STK Push) authentication and request
	return "PENDING", nil
}

func (a *MPesaAdapter) InitiateRefund(ctx context.Context, refundID string, amount int64, currency string, environment string) (string, error) {
	log.Printf("[M-PESA] Initiating refund request for RefundID=%s, Amount=%d, Currency=%s (Environment: %s)\n", refundID, amount, currency, environment)
	// TODO: Implement M-Pesa Refund/Reversal API call
	return "SUCCESS", nil
}

package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"payment-gateway/payment-service/internal/domain"
	handler "payment-gateway/payment-service/internal/handler/http"
	"payment-gateway/payment-service/internal/infrastructure/router"
	"payment-gateway/payment-service/internal/repository"
	"payment-gateway/payment-service/internal/service"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Mock Clients
var mockMerchantID = uuid.New()

type mockMerchant struct {
	valid bool
}

func (m *mockMerchant) ValidateApiKey(ctx context.Context, apiKey string) (bool, uuid.UUID, string, domain.MerchantConfig, error) {
	if m.valid {
		config := domain.MerchantConfig{
			FeeRouting:            "MERCHANT",
			EnabledPaymentMethods: []string{"TELEBIRR", "CBE_BIRR", "VISA"},
		}
		return true, mockMerchantID, "test", config, nil
	}
	return false, uuid.Nil, "", domain.MerchantConfig{}, nil
}

func (m *mockMerchant) GetMerchantName(ctx context.Context, merchantID uuid.UUID) (string, error) {
	return "Mock Merchant", nil
}

type mockRisk struct {
	action string
	err    error
}

func (m *mockRisk) CheckRisk(ctx context.Context, req *domain.Payment) (string, string, error) {
	if m.err != nil {
		return "", "", m.err
	}
	return m.action, "mock", nil
}

type mockProvider struct {
	status string
	err    error
}

func (m *mockProvider) InitiatePayment(ctx context.Context, paymentID uuid.UUID, providerID uuid.UUID, amount int64, currency string) (string, error) {
	if m.err != nil {
		return "TIMEOUT", m.err // Provider unavail maps to TIMEOUT
	}
	return m.status, nil
}

func (m *mockProvider) InitiateRefund(ctx context.Context, paymentID uuid.UUID, providerID uuid.UUID, amount int64, currency string, refundReason *string) (string, error) {
	if m.err != nil {
		return "TIMEOUT", m.err
	}
	return m.status, nil
}

type mockLedger struct {
	status string
	err    error
}

func (m *mockLedger) RecordJournalEntry(ctx context.Context, paymentID uuid.UUID, referenceType string, referenceID string, amount int64, currency string) (string, error) {
	if m.err != nil {
		return "TIMEOUT", m.err
	}
	return m.status, nil
}

func (m *mockLedger) RecordRefundJournalEntry(ctx context.Context, paymentID uuid.UUID, referenceID uuid.UUID, amount int64, currency string) (string, error) {
	if m.err != nil {
		return "TIMEOUT", m.err
	}
	return m.status, nil
}

func setupTestApp(t *testing.T, risk *mockRisk, prov *mockProvider, ledg *mockLedger) (*gorm.DB, *gin.Engine) {
	dbName := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}
	db.AutoMigrate(&domain.Payment{}, &domain.PaymentStateHistory{}, &domain.IdempotencyKey{}, &domain.OutboxEvent{})

	repo := repository.NewPaymentRepository(db)
	merch := &mockMerchant{valid: true}

	orchestrator := service.NewPaymentOrchestrator(repo, merch, risk, prov, ledg)
	paymentHandler := handler.NewPaymentHandler(orchestrator)
	r := router.SetupRouter(paymentHandler)

	return db, r
}

func TestPayment_SuccessFlow(t *testing.T) {
	db, r := setupTestApp(t,
		&mockRisk{action: "ALLOW"},
		&mockProvider{status: "SUCCESS"},
		&mockLedger{status: "COMMITTED"},
	)

	reqBody := map[string]interface{}{
		"merchantReference": "ref-123",
		"amount":            1000,
		"currency":          "ETB",
		"paymentMethod":     "TELEBIRR",
		"providerId":        uuid.New().String(),
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(body))
	req.Header.Set("Idempotency-Key", "idem-123")
	req.Header.Set("X-API-Key", "valid-key")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	var p domain.Payment
	db.First(&p)
	if p.Status != domain.StateSucceeded {
		t.Errorf("Expected SUCCEEDED state, got %s", p.Status)
	}

	var outbox domain.OutboxEvent
	db.First(&outbox)
	if outbox.EventType != "PaymentStatusChanged" {
		t.Errorf("Expected outbox event, got %s", outbox.EventType)
	}
}

func TestPayment_Idempotency(t *testing.T) {
	db, r := setupTestApp(t,
		&mockRisk{action: "ALLOW"},
		&mockProvider{status: "SUCCESS"},
		&mockLedger{status: "COMMITTED"},
	)

	reqBody := map[string]interface{}{
		"merchantReference": "ref-123",
		"amount":            1000,
		"currency":          "ETB",
		"paymentMethod":     "TELEBIRR",
		"providerId":        uuid.New().String(),
	}
	body, _ := json.Marshal(reqBody)

	// First Request
	req1, _ := http.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(body))
	req1.Header.Set("Idempotency-Key", "idem-123")
	req1.Header.Set("X-API-Key", "valid-key")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Fatalf("First request failed: %d", w1.Code)
	}

	var p1 domain.Payment
	db.First(&p1)

	// Second Request with SAME Idempotency Key
	req2, _ := http.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(body))
	req2.Header.Set("Idempotency-Key", "idem-123")
	req2.Header.Set("X-API-Key", "valid-key")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("Second request failed: %d", w2.Code)
	}

	// Verify only 1 payment exists
	var count int64
	db.Model(&domain.Payment{}).Count(&count)
	if count != 1 {
		t.Errorf("Idempotency failed: expected 1 payment, found %d", count)
	}
}

func TestPayment_ProviderTimeout_Is_Unknown(t *testing.T) {
	db, r := setupTestApp(t,
		&mockRisk{action: "ALLOW"},
		&mockProvider{status: "", err: errors.New("timeout")}, // Provider times out
		&mockLedger{status: "COMMITTED"},
	)

	reqBody := map[string]interface{}{
		"merchantReference": "ref-123",
		"amount":            1000,
		"currency":          "ETB",
		"paymentMethod":     "TELEBIRR",
		"providerId":        uuid.New().String(),
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(body))
	req.Header.Set("Idempotency-Key", "idem-timeout")
	req.Header.Set("X-API-Key", "valid-key")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// An UNKNOWN state returns 202 Accepted because the status isn't terminal
	if w.Code != http.StatusAccepted {
		t.Errorf("Expected 202 Accepted for UNKNOWN, got %d", w.Code)
	}

	var p domain.Payment
	db.First(&p)
	if p.Status != domain.StateUnknown {
		t.Errorf("Expected UNKNOWN state, got %s", p.Status)
	}
}

func TestPayment_LedgerTimeout_Is_Unknown(t *testing.T) {
	db, r := setupTestApp(t,
		&mockRisk{action: "ALLOW"},
		&mockProvider{status: "SUCCESS"},
		&mockLedger{status: "", err: errors.New("ledger timeout")}, // Ledger times out
	)

	reqBody := map[string]interface{}{
		"merchantReference": "ref-123",
		"amount":            1000,
		"currency":          "ETB",
		"paymentMethod":     "TELEBIRR",
		"providerId":        uuid.New().String(),
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(body))
	req.Header.Set("Idempotency-Key", "idem-ledger")
	req.Header.Set("X-API-Key", "valid-key")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusAccepted {
		t.Errorf("Expected 202 Accepted, got %d", w.Code)
	}

	var p domain.Payment
	db.First(&p)
	if p.Status != domain.StateUnknown {
		t.Errorf("Expected UNKNOWN state due to ledger timeout, got %s", p.Status)
	}
}

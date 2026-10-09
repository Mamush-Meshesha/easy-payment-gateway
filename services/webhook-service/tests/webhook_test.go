package tests

import (
	"context"
	"net/http"
	"net/http/httptest"
	"payment-gateway/webhook-service/internal/domain"
	"payment-gateway/webhook-service/internal/repository"
	"payment-gateway/webhook-service/internal/service"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type mockMerchant struct {
	url    string
	secret string
}

func (m *mockMerchant) GetWebhookConfig(ctx context.Context, merchantID uuid.UUID, environment string) (string, string, error) {
	return m.url, m.secret, nil
}

func setupTestApp(t *testing.T, merchant *mockMerchant) (*gorm.DB, *service.DispatcherService, domain.WebhookRepository) {
	dbName := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}
	db.Exec("ATTACH DATABASE ':memory:' AS webhook")
	db.AutoMigrate(&domain.Delivery{}, &domain.Attempt{})

	repo := repository.NewWebhookRepository(db)
	svc := service.NewDispatcherService(repo, merchant)

	return db, svc, repo
}

func TestDispatcher_Success200(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	merchant := &mockMerchant{url: server.URL, secret: "secret123"}
	db, svc, repo := setupTestApp(t, merchant)

	deliveryID := uuid.New()
	d := &domain.Delivery{
		ID:           deliveryID,
		PaymentID:    uuid.New(),
		MerchantID:   uuid.New(),
		URL:          "", // Populated by service
		Status:       domain.StatePending,
		Payload:      `{"status":"SUCCEEDED"}`,
		AttemptCount: 0,
	}
	repo.IdempotentInsertDelivery(context.Background(), d)

	err := svc.ProcessDelivery(context.Background(), d)
	if err != nil {
		t.Fatalf("ProcessDelivery failed: %v", err)
	}

	var saved domain.Delivery
	db.First(&saved, "id = ?", deliveryID)

	if saved.Status != domain.StateDelivered {
		t.Errorf("Expected DELIVERED, got %s", saved.Status)
	}
	if saved.AttemptCount != 1 {
		t.Errorf("Expected 1 attempt, got %d", saved.AttemptCount)
	}

	var attempt domain.Attempt
	db.First(&attempt, "delivery_id = ?", deliveryID)
	if *attempt.HTTPStatus != 200 {
		t.Errorf("Expected attempt HTTP status 200, got %d", *attempt.HTTPStatus)
	}
}

func TestDispatcher_Retryable503(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable) // 503
	}))
	defer server.Close()

	merchant := &mockMerchant{url: server.URL, secret: "secret123"}
	db, svc, repo := setupTestApp(t, merchant)

	deliveryID := uuid.New()
	d := &domain.Delivery{
		ID:           deliveryID,
		PaymentID:    uuid.New(),
		MerchantID:   uuid.New(),
		Status:       domain.StatePending,
		Payload:      `{"status":"SUCCEEDED"}`,
		AttemptCount: 0,
	}
	repo.IdempotentInsertDelivery(context.Background(), d)

	err := svc.ProcessDelivery(context.Background(), d)
	if err != nil {
		t.Fatalf("ProcessDelivery failed: %v", err)
	}

	var saved domain.Delivery
	db.First(&saved, "id = ?", deliveryID)

	if saved.Status != domain.StateRetryWait {
		t.Errorf("Expected RETRY_WAIT, got %s", saved.Status)
	}
	if saved.AttemptCount != 1 {
		t.Errorf("Expected 1 attempt, got %d", saved.AttemptCount)
	}
	if saved.NextRetryAt.IsZero() {
		t.Errorf("Expected NextRetryAt to be set")
	}

	// Wait, next retry should be roughly 10 seconds away (baseDelaySecs=10)
	diff := saved.NextRetryAt.Sub(time.Now())
	if diff < 9*time.Second || diff > 13*time.Second { // 10s + up to 2s jitter
		t.Errorf("Expected retry diff to be ~10s, got %v", diff)
	}
}

func TestDispatcher_NonRetryable400(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest) // 400
	}))
	defer server.Close()

	merchant := &mockMerchant{url: server.URL, secret: "secret123"}
	db, svc, repo := setupTestApp(t, merchant)

	deliveryID := uuid.New()
	d := &domain.Delivery{
		ID:           deliveryID,
		PaymentID:    uuid.New(),
		MerchantID:   uuid.New(),
		Status:       domain.StatePending,
		Payload:      `{"status":"SUCCEEDED"}`,
		AttemptCount: 0,
	}
	repo.IdempotentInsertDelivery(context.Background(), d)

	err := svc.ProcessDelivery(context.Background(), d)
	if err != nil {
		t.Fatalf("ProcessDelivery failed: %v", err)
	}

	var saved domain.Delivery
	db.First(&saved, "id = ?", deliveryID)

	if saved.Status != domain.StateDeadLettered {
		t.Errorf("Expected DEAD_LETTERED, got %s", saved.Status)
	}
}

package tests

import (
	"context"
	"payment-gateway/transaction-service/internal/domain"
	"payment-gateway/transaction-service/internal/repository"
	"payment-gateway/transaction-service/internal/service"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestApp(t *testing.T) (*gorm.DB, domain.TransactionService) {
	dbName := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}
	db.AutoMigrate(&domain.Transaction{}, &domain.OutboxEvent{})

	repo := repository.NewTransactionRepository(db)
	svc := service.NewTransactionService(repo)

	return db, svc
}

func TestProcessProviderEvent_SuccessFlow(t *testing.T) {
	db, svc := setupTestApp(t)

	provID := uuid.New().String()
	payID := uuid.New().String()

	event := domain.ProviderNormalizedEvent{
		EventID:               uuid.New().String(),
		ProviderID:            provID,
		ProviderTransactionID: "prov-tx-123",
		PaymentID:             payID,
		Status:                "SUCCESS",
		Timestamp:             time.Now().Format(time.RFC3339),
	}

	err := svc.ProcessProviderEvent(context.Background(), event)
	if err != nil {
		t.Fatalf("Failed to process event: %v", err)
	}

	// Verify Transaction inserted
	var tx domain.Transaction
	if err := db.First(&tx).Error; err != nil {
		t.Fatalf("Failed to find transaction: %v", err)
	}
	if tx.Status != "SUCCESS" {
		t.Errorf("Expected SUCCESS, got %s", tx.Status)
	}

	// Verify Outbox generated
	var outbox domain.OutboxEvent
	if err := db.First(&outbox).Error; err != nil {
		t.Fatalf("Failed to find outbox event: %v", err)
	}
	if outbox.Status != "PENDING" {
		t.Errorf("Expected outbox to be PENDING")
	}
}

func TestProcessProviderEvent_DuplicateWebhookIgnored(t *testing.T) {
	db, svc := setupTestApp(t)

	provID := uuid.New().String()
	payID := uuid.New().String()

	event1 := domain.ProviderNormalizedEvent{
		EventID:               uuid.New().String(),
		ProviderID:            provID,
		ProviderTransactionID: "prov-tx-dup",
		PaymentID:             payID,
		Status:                "SUCCESS",
		Timestamp:             time.Now().Format(time.RFC3339),
	}

	event2 := domain.ProviderNormalizedEvent{
		EventID:               uuid.New().String(),
		ProviderID:            provID,
		ProviderTransactionID: "prov-tx-dup",
		PaymentID:             payID,
		Status:                "SUCCESS",
		Timestamp:             time.Now().Add(1 * time.Second).Format(time.RFC3339),
	}

	err := svc.ProcessProviderEvent(context.Background(), event1)
	if err != nil {
		t.Fatalf("Failed to process event 1: %v", err)
	}

	err = svc.ProcessProviderEvent(context.Background(), event2)
	if err != nil {
		t.Fatalf("Failed to process event 2: %v", err) // ErrStaleEvent is swallowed by service and returns nil
	}

	// Verify only 1 transaction exists
	var txCount int64
	db.Model(&domain.Transaction{}).Count(&txCount)
	if txCount != 1 {
		t.Errorf("Expected 1 transaction, got %d", txCount)
	}

	// Verify only 1 outbox event exists (the duplicate shouldn't trigger an outbox)
	var outboxCount int64
	db.Model(&domain.OutboxEvent{}).Count(&outboxCount)
	if outboxCount != 1 {
		t.Errorf("Expected 1 outbox event, got %d", outboxCount)
	}
}

func TestProcessProviderEvent_OutOfOrder(t *testing.T) {
	db, svc := setupTestApp(t)

	provID := uuid.New().String()
	payID := uuid.New().String()

	// 1. Success arrives first
	eventSuccess := domain.ProviderNormalizedEvent{
		EventID:               uuid.New().String(),
		ProviderID:            provID,
		ProviderTransactionID: "prov-tx-order",
		PaymentID:             payID,
		Status:                "SUCCESS",
		Timestamp:             time.Now().Format(time.RFC3339),
	}

	// 2. Pending arrives second (out of order webhook)
	eventPending := domain.ProviderNormalizedEvent{
		EventID:               uuid.New().String(),
		ProviderID:            provID,
		ProviderTransactionID: "prov-tx-order",
		PaymentID:             payID,
		Status:                "PENDING",
		Timestamp:             time.Now().Format(time.RFC3339),
	}

	err := svc.ProcessProviderEvent(context.Background(), eventSuccess)
	if err != nil {
		t.Fatalf("Failed to process success event: %v", err)
	}

	err = svc.ProcessProviderEvent(context.Background(), eventPending)
	if err != nil {
		t.Fatalf("Failed to process pending event: %v", err)
	}

	// Verify status remains SUCCESS
	var tx domain.Transaction
	db.First(&tx)
	if tx.Status != "SUCCESS" {
		t.Errorf("Expected status to remain SUCCESS, got %s", tx.Status)
	}
}

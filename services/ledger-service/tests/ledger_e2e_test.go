package tests

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"payment-gateway/ledger-service/internal/domain"
	grpchandler "payment-gateway/ledger-service/internal/handler/grpc"
	httphandler "payment-gateway/ledger-service/internal/handler/http"
	"payment-gateway/ledger-service/internal/infrastructure/router"
	"payment-gateway/ledger-service/internal/repository"
	"payment-gateway/ledger-service/internal/service"
	pb "payment-gateway/ledger-service/proto"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open sqlite memory db: %v", err)
	}

	err = db.AutoMigrate(&domain.Account{}, &domain.JournalEntry{}, &domain.JournalLine{}, &domain.OutboxEvent{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	return db
}

func setupTestEnvironment(t *testing.T) (*gorm.DB, pb.LedgerServiceServer, *gin.Engine) {
	db := setupTestDB(t)
	repo := repository.NewLedgerRepository(db)
	svc := service.NewLedgerService(repo)

	grpcServer := grpchandler.NewLedgerGrpcServer(svc)
	httpServer := httphandler.NewLedgerHandler(svc)
	r := router.SetupRouter(httpServer)

	return db, grpcServer, r
}

func TestRecordJournalEntry_Balanced(t *testing.T) {
	db, grpcServer, _ := setupTestEnvironment(t)

	assetAccID := uuid.New()
	liabAccID := uuid.New()

	db.Create(&domain.Account{
		ID:       assetAccID,
		Name:     "Bank Asset",
		Type:     domain.AccountTypeAsset,
		Currency: "ETB",
		Balance:  0,
	})
	db.Create(&domain.Account{
		ID:       liabAccID,
		Name:     "Merchant Liability",
		Type:     domain.AccountTypeLiability,
		Currency: "ETB",
		Balance:  0,
	})

	req := &pb.RecordJournalEntryRequest{
		ReferenceType: "PAYMENT",
		ReferenceId:   uuid.NewString(),
		Currency:      "ETB",
		Lines: []*pb.JournalLineRequest{
			{AccountId: assetAccID.String(), Direction: "DEBIT", Amount: 5000},
			{AccountId: liabAccID.String(), Direction: "CREDIT", Amount: 5000},
		},
	}

	res, err := grpcServer.RecordJournalEntry(context.Background(), req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if !res.Success {
		t.Fatalf("Expected success, got false. Error: %s", res.Error)
	}

	// Verify Balances
	var assetAcc, liabAcc domain.Account
	db.First(&assetAcc, "id = ?", assetAccID)
	db.First(&liabAcc, "id = ?", liabAccID)

	if assetAcc.Balance != 5000 {
		t.Errorf("Asset balance expected 5000, got %d", assetAcc.Balance)
	}
	if liabAcc.Balance != 5000 {
		t.Errorf("Liability balance expected 5000, got %d", liabAcc.Balance)
	}
}

func TestRecordJournalEntry_Unbalanced(t *testing.T) {
	db, grpcServer, _ := setupTestEnvironment(t)

	assetAccID := uuid.New()
	liabAccID := uuid.New()

	db.Create(&domain.Account{
		ID:       assetAccID,
		Name:     "Bank Asset",
		Type:     domain.AccountTypeAsset,
		Currency: "ETB",
	})
	db.Create(&domain.Account{
		ID:       liabAccID,
		Name:     "Merchant Liability",
		Type:     domain.AccountTypeLiability,
		Currency: "ETB",
	})

	req := &pb.RecordJournalEntryRequest{
		ReferenceType: "PAYMENT",
		ReferenceId:   uuid.NewString(),
		Currency:      "ETB",
		Lines: []*pb.JournalLineRequest{
			{AccountId: assetAccID.String(), Direction: "DEBIT", Amount: 5000},
			{AccountId: liabAccID.String(), Direction: "CREDIT", Amount: 4000}, // UNBALANCED!
		},
	}

	res, _ := grpcServer.RecordJournalEntry(context.Background(), req)
	if res.Success {
		t.Fatal("Expected unbalanced entry to fail, but it succeeded")
	}
	if res.Error != domain.ErrUnbalancedEntry.Error() {
		t.Fatalf("Expected %v, got %s", domain.ErrUnbalancedEntry, res.Error)
	}
}

func TestRecordJournalEntry_NegativeAmount(t *testing.T) {
	db, grpcServer, _ := setupTestEnvironment(t)
	accID := uuid.New()
	db.Create(&domain.Account{ID: accID, Type: domain.AccountTypeAsset, Currency: "ETB"})

	req := &pb.RecordJournalEntryRequest{
		ReferenceType: "PAYMENT",
		ReferenceId:   uuid.NewString(),
		Currency:      "ETB",
		Lines: []*pb.JournalLineRequest{
			{AccountId: accID.String(), Direction: "DEBIT", Amount: -100},
			{AccountId: accID.String(), Direction: "CREDIT", Amount: -100},
		},
	}

	res, _ := grpcServer.RecordJournalEntry(context.Background(), req)
	if res.Success {
		t.Fatal("Expected negative amount entry to fail, but it succeeded")
	}
}

func TestGetAccountBalance_HTTP(t *testing.T) {
	db, _, router := setupTestEnvironment(t)

	accID := uuid.New()
	db.Create(&domain.Account{
		ID:       accID,
		Name:     "Test Account",
		Type:     domain.AccountTypeAsset,
		Currency: "ETB",
		Balance:  12345,
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/accounts/"+accID.String()+"/balance", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}

	var acc domain.Account
	err := json.Unmarshal(w.Body.Bytes(), &acc)
	if err != nil {
		t.Fatal(err)
	}
	if acc.Balance != 12345 {
		t.Errorf("Expected balance 12345, got %d", acc.Balance)
	}
}

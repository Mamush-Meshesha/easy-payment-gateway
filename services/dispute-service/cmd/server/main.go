package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"payment-gateway/dispute-service/internal/domain"
	disputeHttp "payment-gateway/dispute-service/internal/handler/http"
	"payment-gateway/dispute-service/internal/infrastructure/grpcclient"
	"payment-gateway/dispute-service/internal/infrastructure/workers"
	"payment-gateway/dispute-service/internal/repository"
	"payment-gateway/dispute-service/internal/service"
)

func main() {
	log.Println("Starting Dispute Service...")

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=dispute_db port=5433 sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Running AutoMigrate...")
	if err := db.AutoMigrate(
		&domain.Dispute{},
		&domain.Evidence{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	// 2. Initialize gRPC Clients
	ledgerServiceAddr := os.Getenv("LEDGER_SERVICE_ADDR")
	if ledgerServiceAddr == "" {
		ledgerServiceAddr = "localhost:50053"
	}
	ledgerClient, err := grpcclient.NewLedgerClient(ledgerServiceAddr)
	if err != nil {
		log.Fatalf("Failed to initialize LedgerClient: %v", err)
	}

	repo := repository.NewDisputeRepository(db)

	// 3. Initialize Domain Services / Orchestrators
	orchestrator := service.NewDisputeOrchestrator(repo, ledgerClient)

	// 4. Background Workers
	networkWorker := workers.NewNetworkWorker(orchestrator)
	go networkWorker.Start(context.Background())

	handler := disputeHttp.NewDisputeHandler(orchestrator, repo)

	r := gin.Default()

	api := r.Group("/api/v1/disputes")
	{
		api.GET("", handler.ListDisputes)
		api.POST("/simulate", handler.SimulateDispute)
		api.GET("/:id", handler.GetDispute)
		api.POST("/:id/evidence", handler.AddEvidence)
		api.POST("/:id/accept", handler.AcceptDispute)
	}

	// System endpoints (e.g. called internally by Webhook Service or Provider Service mock)
	sys := r.Group("/api/v1/system/disputes")
	{
		sys.POST("/trigger", handler.SystemTriggerDispute)
		sys.POST("/:id/resolve", handler.SystemResolveDispute)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3017"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	log.Printf("Dispute Service HTTP listening on :%s\n", port)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down Dispute Service...")
}

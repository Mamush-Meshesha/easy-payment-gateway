package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"payment-gateway/go-observability"
	"syscall"

	settlementhandler "payment-gateway/settlement-service/internal/controller"
	"payment-gateway/settlement-service/internal/domain"
	grpcclient "payment-gateway/settlement-service/internal/infrastructure/grpcclient"
	"payment-gateway/settlement-service/internal/infrastructure/grpcserver"
	"payment-gateway/settlement-service/internal/infrastructure/provider"
	"payment-gateway/settlement-service/internal/repository"
	"payment-gateway/settlement-service/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {

	// Initialize Observability
	tp, err := observability.InitTracing("settlement-service")
	if err != nil {
		log.Fatalf("failed to initialize tracing: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	// 1. Database
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is required but not set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to settlement database: %v", err)
	}

	if err := db.AutoMigrate(&domain.Payout{}); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	// 2. Repository
	payoutRepo := repository.NewPayoutRepository(db)

	// 3. gRPC Clients
	ledgerAddr := getEnv("LEDGER_SERVICE_ADDR", "ledger-service:50053")
	ledgerClient, err := grpcclient.NewLedgerClient(ledgerAddr)
	if err != nil {
		log.Fatalf("failed to connect to ledger service: %v", err)
	}

	merchantAddr := getEnv("MERCHANT_SERVICE_ADDR", "merchant-service:50051")
	merchantClient, err := grpcclient.NewMerchantClient(merchantAddr)
	if err != nil {
		log.Fatalf("failed to connect to merchant service: %v", err)
	}

	// 4. Payout Provider (bank transfer stub — UNKNOWN until real integration is wired)
	payoutProvider := provider.NewBankTransferProvider()

	// 5. Service
	settlementSvc := service.NewSettlementService(payoutRepo, ledgerClient, merchantClient, payoutProvider)

	// 6. HTTP server (internal trigger only — not exposed via nginx)
	r := gin.New()
	r.Use(observability.MetricsMiddleware())
	r.GET("/metrics", observability.MetricsHandler())
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "settlement-service"})
	})

	settlementHandler := settlementhandler.NewSettlementHandler(settlementSvc)
	internal := r.Group("/internal")
	{
		internal.POST("/settlements/trigger", settlementHandler.HandleTriggerSettlement)
		internal.GET("/settlements/:id", settlementHandler.HandleGetSettlement)
	}

	port := getEnv("PORT", "3010")
	go func() {
		log.Printf("Settlement Service listening on :%s", port)
		if err := r.Run(":" + port); err != nil {
			log.Fatalf("Settlement Service HTTP server failed: %v", err)
		}
	}()

	go grpcserver.StartGrpcServer(payoutRepo, ":50057")

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	log.Println("Settlement Service shutting down...")
}

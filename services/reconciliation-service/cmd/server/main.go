package main

import (
	"context"
	"payment-gateway/go-observability"
	"log"
	"os"
	"os/signal"
	"syscall"

	"payment-gateway/reconciliation-service/internal/domain"
	"payment-gateway/reconciliation-service/internal/engine"
	"payment-gateway/reconciliation-service/internal/handler/http"
	"payment-gateway/reconciliation-service/internal/infrastructure/grpcclient"
	"payment-gateway/reconciliation-service/internal/repository"
	"payment-gateway/reconciliation-service/internal/service"

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
	tp, err := observability.InitTracing("reconciliation-service")
	if err != nil {
		log.Fatalf("failed to initialize tracing: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	log.Println("Starting Reconciliation Service...")

	// 1. Database Connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is required but not set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Migrate schemas
	if err := db.AutoMigrate(
		&domain.ReconciliationStatement{},
		&domain.ReconciliationJob{},
		&domain.ReconciliationException{},
		&domain.ReconciliationExceptionAction{},
	); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	// 2. Repository
	repo := repository.NewReconciliationRepository(db)

	// 3. gRPC Client (Ledger)
	ledgerAddr := getEnv("LEDGER_SERVICE_ADDR", "ledger-service:50053")
	ledgerClient, err := grpcclient.NewLedgerClient(ledgerAddr)
	if err != nil {
		log.Fatalf("failed to connect to ledger service: %v", err)
	}

	// 4. Engine & Service
	source := service.NewCSVStatementSource()
	recEngine := engine.NewReconciliationEngine(repo, ledgerClient)
	recService := service.NewReconciliationService(repo, source, recEngine)

	// 5. HTTP Handler & Router
	r := gin.New()
	r.Use(observability.MetricsMiddleware())
	r.GET("/metrics", observability.MetricsHandler())
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "reconciliation-service"})
	})

	handler := http.NewReconciliationHandler(recService)
	handler.RegisterRoutes(r)

	// 6. Start Server
	port := getEnv("PORT", "3011")
	go func() {
		log.Printf("Reconciliation Service listening on :%s", port)
		if err := r.Run(":" + port); err != nil {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	log.Println("Shutting down")
}

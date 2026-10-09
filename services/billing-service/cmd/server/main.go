package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"payment-gateway/billing-service/internal/domain"
	billingHttp "payment-gateway/billing-service/internal/handler/http"
	"payment-gateway/billing-service/internal/infrastructure/grpcclient"
	"payment-gateway/billing-service/internal/repository"
	"payment-gateway/billing-service/internal/service"
)

func main() {
	log.Println("Starting Billing Service...")

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=billing_db port=5433 sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Running AutoMigrate...")
	if err := db.AutoMigrate(
		&domain.Plan{},
		&domain.Subscription{},
		&domain.Invoice{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	// 2. Initialize gRPC Clients
	paymentServiceAddr := os.Getenv("PAYMENT_SERVICE_ADDR")
	if paymentServiceAddr == "" {
		paymentServiceAddr = "localhost:50059"
	}
	paymentClient, err := grpcclient.NewPaymentClient(paymentServiceAddr)
	if err != nil {
		log.Fatalf("Failed to initialize PaymentClient: %v", err)
	}

	repo := repository.NewBillingRepository(db)

	// 3. Initialize Domain Services / Orchestrators
	orchestrator := service.NewBillingOrchestrator(repo, paymentClient)

	// Start the cron worker in the background
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				orchestrator.ProcessDueSubscriptions()
			}
		}
	}()

	kafkaBrokers := []string{"localhost:9092"}
	if os.Getenv("KAFKA_BROKERS") != "" {
		kafkaBrokers = []string{os.Getenv("KAFKA_BROKERS")}
	}
	kafkaConsumer := service.NewBillingKafkaConsumer(repo, kafkaBrokers)
	go kafkaConsumer.Start(context.Background())

	handler := billingHttp.NewBillingHandler(repo)

	r := gin.Default()

	api := r.Group("/api/v1/billing")
	{
		api.POST("/plans", handler.CreatePlan)
		api.GET("/plans", handler.GetPlans)
		api.POST("/subscriptions", handler.CreateSubscription)
		api.GET("/subscriptions", handler.GetSubscriptions)
		api.POST("/subscriptions/:id/cancel", handler.CancelSubscription)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3015" // Let's use 3015 for billing-service
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

	log.Printf("Billing Service HTTP listening on :%s\n", port)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down Billing Service...")
}

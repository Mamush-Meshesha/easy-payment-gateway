package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"payment-gateway/go-observability"
	"syscall"

	"payment-gateway/transaction-service/internal/domain"
	"payment-gateway/transaction-service/internal/infrastructure/kafka"
	"payment-gateway/transaction-service/internal/models"
	"payment-gateway/transaction-service/internal/repository"
	"payment-gateway/transaction-service/internal/service"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	// Initialize Observability
	tp, err := observability.InitTracing("transaction-service")
	if err != nil {
		log.Fatalf("failed to initialize tracing: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	log.Println("Starting Transaction Service...")

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=payment_gateway port=5433 sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// Auto migrate
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
	db.Exec("CREATE SCHEMA IF NOT EXISTS transaction;")
	db.Exec("SET search_path TO transaction, public;")
	if err := db.AutoMigrate(&models.Transaction{}, &models.TransactionStatusHistory{}, &domain.OutboxEvent{}); err != nil {
		log.Fatalf("failed to auto migrate: %v", err)
	}

	repo := repository.NewTransactionRepository(db)
	svc := service.NewTransactionService(repo)

	kafkaBrokers := []string{"kafka:9092"}
	if os.Getenv("KAFKA_BROKERS") != "" {
		kafkaBrokers = []string{os.Getenv("KAFKA_BROKERS")}
	}

	consumer := kafka.NewProviderEventConsumer(kafkaBrokers, "provider.normalized.event", "transaction-service-group", svc)
	outboxWorker := kafka.NewOutboxRelayWorker(db, kafkaBrokers, "transaction.status.updated")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go consumer.Start(ctx)
	go outboxWorker.Start(ctx)

	log.Println("Transaction Service is running.")
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Shutting down Transaction Service...")
	cancel()
}

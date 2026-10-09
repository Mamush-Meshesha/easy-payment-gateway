package main

import (
	"context"
	"log"
	"net"
	"os"
	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/go-observability"
	"payment-gateway/ledger-service/internal/domain"
	grpchandler "payment-gateway/ledger-service/internal/handler/grpc"
	"payment-gateway/ledger-service/internal/handler/http"
	"payment-gateway/ledger-service/internal/infrastructure/kafka"
	"payment-gateway/ledger-service/internal/infrastructure/router"
	"payment-gateway/ledger-service/internal/repository"
	"payment-gateway/ledger-service/internal/service"
	pb "payment-gateway/ledger-service/proto"

	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	// Initialize Observability
	tp, err := observability.InitTracing("ledger-service")
	if err != nil {
		log.Fatalf("failed to initialize tracing: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=ledger_db port=5433 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Auto Migrate (Will be replaced with raw SQL migrations in Phase 13/v2)
	db.AutoMigrate(&domain.Account{}, &domain.JournalEntry{}, &domain.OutboxEvent{})

	// Dependency Injection
	ledgerRepo := repository.NewLedgerRepository(db)
	ledgerService := service.NewLedgerService(ledgerRepo)
	ledgerHttpHandler := http.NewLedgerHandler(ledgerService)
	ledgerGrpcHandler := grpchandler.NewLedgerGrpcServer(ledgerService)

	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50053"
	}
	lis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("failed to listen on gRPC port: %v", err)
	}

	// mTLS and Interceptor Setup
	caCert := os.Getenv("MTLS_CA_CERT")
	serverCert := os.Getenv("MTLS_SERVER_CERT")
	serverKey := os.Getenv("MTLS_SERVER_KEY")

	creds, err := grpcauth.LoadServerTLSCredentials(caCert, serverCert, serverKey)
	if err != nil {
		log.Fatalf("failed to load TLS credentials: %v", err)
	}

	grpcServer := grpc.NewServer(
		grpc.Creds(creds),
		grpc.UnaryInterceptor(grpcauth.AuthInterceptor(grpcauth.GlobalPolicy)),
	)

	pb.RegisterLedgerServiceServer(grpcServer, ledgerGrpcHandler)

	go func() {
		log.Printf("gRPC server listening on port %s", grpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// Kafka Consumer Setup
	kafkaBrokers := []string{os.Getenv("KAFKA_BROKERS")}
	if kafkaBrokers[0] == "" {
		kafkaBrokers = []string{"localhost:9092"}
	}
	merchantEventsConsumer := kafka.NewMerchantEventsConsumer(kafkaBrokers, "merchant.events", "ledger-service-group", ledgerService)
	go merchantEventsConsumer.Start(context.Background())

	// HTTP Router Setup
	r := router.SetupRouter(ledgerHttpHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("HTTP server listening on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}

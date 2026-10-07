package main

import (
	"context"
	"log"
	"net"
	"os"
	"time"
	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/go-observability"
	"payment-gateway/payment-service/internal/domain"
	"payment-gateway/payment-service/internal/handler/http"
	"payment-gateway/payment-service/internal/infrastructure/cache"
	"payment-gateway/payment-service/internal/infrastructure/grpcclient"
	"payment-gateway/payment-service/internal/infrastructure/grpcserver"
	"payment-gateway/payment-service/internal/infrastructure/kafka"
	"payment-gateway/payment-service/internal/infrastructure/router"
	"payment-gateway/payment-service/internal/infrastructure/workers"
	"payment-gateway/payment-service/internal/repository"
	"payment-gateway/payment-service/internal/service"
	pb "payment-gateway/payment-service/proto"

	"google.golang.org/grpc"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	// Initialize Observability
	tp, err := observability.InitTracing("payment-service")
	if err != nil {
		log.Fatalf("failed to initialize tracing: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	// 1. Database Setup
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=payment_db port=5433 sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	db.AutoMigrate(&domain.Payment{}, &domain.PaymentStateHistory{}, &domain.IdempotencyKey{}, &domain.OutboxEvent{}, &domain.Refund{}, &domain.RefundStateHistory{})

	// 2. gRPC Clients
	merchantAddr := getEnv("MERCHANT_SERVICE_ADDR", "localhost:50051")
	merchantClient, err := grpcclient.NewMerchantClient(merchantAddr)
	if err != nil {
		log.Fatalf("failed to connect to merchant service: %v", err)
	}

	riskAddr := getEnv("RISK_SERVICE_ADDR", "localhost:50054")
	riskClient, err := grpcclient.NewRiskClient(riskAddr)
	if err != nil {
		log.Fatalf("failed to connect to risk service: %v", err)
	}

	providerAddr := getEnv("PROVIDER_SERVICE_ADDR", "localhost:50052")
	providerClient, err := grpcclient.NewProviderClient(providerAddr)
	if err != nil {
		log.Fatalf("failed to connect to provider service: %v", err)
	}

	ledgerAddr := getEnv("LEDGER_SERVICE_ADDR", "localhost:50053")
	ledgerClient, err := grpcclient.NewLedgerClient(ledgerAddr)
	if err != nil {
		log.Fatalf("failed to connect to ledger service: %v", err)
	}

	pricingAddr := getEnv("PRICING_SERVICE_ADDR", "localhost:50064")
	pricingClient, err := grpcclient.NewPricingClient(pricingAddr)
	if err != nil {
		log.Fatalf("failed to connect to pricing service: %v", err)
	}

	// 3. Dependency Injection
	paymentRepo := repository.NewPaymentRepository(db)

	redisUrl := getEnv("REDIS_URL", "redis://localhost:6379")
	configCache, err := cache.NewMerchantConfigCache(redisUrl)
	if err != nil {
		log.Printf("failed to initialize redis cache, continuing without cache: %v", err)
	}

	orchestrator := service.NewPaymentOrchestrator(paymentRepo, merchantClient, configCache, riskClient, providerClient, ledgerClient, pricingClient)
	paymentHandler := http.NewPaymentHandler(orchestrator)

	// 4. HTTP Router
	r := router.SetupRouter(paymentHandler)

	// 4.5 gRPC Server
	grpcPort := getEnv("GRPC_PORT", "50051")
	lis, err := net.Listen("tcp", "0.0.0.0:"+grpcPort)
	if err != nil {
		log.Fatalf("failed to listen on gRPC port: %v", err)
	}

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

	readGrpcHandler := grpcserver.NewPaymentReadGrpcServer(paymentRepo)
	pb.RegisterPaymentReadServiceServer(grpcServer, readGrpcHandler)

	writeGrpcHandler := grpcserver.NewPaymentWriteGrpcServer(paymentRepo, orchestrator)
	pb.RegisterPaymentWriteServiceServer(grpcServer, writeGrpcHandler)

	go func() {
		log.Printf("gRPC server listening on port %s", grpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// 5. Background Workers
	kafkaBrokers := []string{getEnv("KAFKA_BROKERS", "kafka:9092")}
	transactionConsumer := kafka.NewTransactionStatusConsumer(kafkaBrokers, "transaction.status.updated", "payment-service-group", orchestrator)
	go transactionConsumer.Start(context.Background())

	merchantConfigConsumer := kafka.NewMerchantConfigConsumer(kafkaBrokers, "merchant.events", "payment-service-merchant-events-group", configCache)
	go merchantConfigConsumer.Start(context.Background())

	outboxWorker := kafka.NewOutboxRelayWorker(db, kafkaBrokers, "payment.events")
	go outboxWorker.Start(context.Background())

	ledgerWorker := workers.NewLedgerRecoveryWorker(db, ledgerClient, pricingClient, orchestrator)
	go ledgerWorker.Start(context.Background())
	
	importTime := time.Hour * 24 // 24 hours
	prunerWorker := workers.NewIdempotencyPruner(paymentRepo, importTime, 30) // 30 days retention
	go prunerWorker.Start(context.Background())
	
	port := getEnv("PORT", "8084")

	log.Printf("Payment Service starting on port %s", port)
	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

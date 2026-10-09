package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"payment-gateway/go-observability"
	"syscall"

	"github.com/google/uuid"
	"google.golang.org/grpc"

	grpcauth "payment-gateway/go-grpc-auth"
	pb "payment-gateway/webhook-service/proto"

	"payment-gateway/webhook-service/internal/domain"
	"payment-gateway/webhook-service/internal/infrastructure/grpcclient"
	"payment-gateway/webhook-service/internal/infrastructure/grpcserver"
	"payment-gateway/webhook-service/internal/infrastructure/kafka"
	"payment-gateway/webhook-service/internal/infrastructure/workers"
	"payment-gateway/webhook-service/internal/repository"
	"payment-gateway/webhook-service/internal/service"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type DummyMerchantClient struct{}

func (d *DummyMerchantClient) GetWebhookConfig(ctx context.Context, merchantID uuid.UUID, environment string) (url string, secret string, err error) {
	// For testing Phase 6, we hardcode the webhook destination to a local test server
	return "http://host.docker.internal:9999/webhook", "test-secret", nil
}

func main() {

	// Initialize Observability
	tp, err := observability.InitTracing("webhook-service")
	if err != nil {
		log.Fatalf("failed to initialize tracing: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	log.Println("Starting Webhook Service...")

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
	db.Exec("CREATE SCHEMA IF NOT EXISTS webhook;")
	db.Exec("SET search_path TO webhook, public;")
	if err := db.AutoMigrate(&domain.Delivery{}, &domain.Attempt{}); err != nil {
		log.Fatalf("failed to auto migrate: %v", err)
	}

	repo := repository.NewWebhookRepository(db)

	// Create service
	merchantAddress := os.Getenv("MERCHANT_SERVICE_URL")
	if merchantAddress == "" {
		merchantAddress = "localhost:50052"
	}
	merchantClient, err := grpcclient.NewMerchantGrpcClient(merchantAddress)
	if err != nil {
		log.Fatalf("failed to init merchant client: %v", err)
	}

	svc := service.NewDispatcherService(repo, merchantClient)

	kafkaBrokers := []string{"kafka:9092"}
	if os.Getenv("KAFKA_BROKERS") != "" {
		kafkaBrokers = []string{os.Getenv("KAFKA_BROKERS")}
	}

	consumer := kafka.NewPaymentEventConsumer(kafkaBrokers, "payment.events", "webhook-service-group", repo)
	dispatcher := workers.NewDispatcherWorker(repo, svc)
	janitor := workers.NewJanitorWorker(repo)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go consumer.Start(ctx)
	go dispatcher.Start(ctx)
	go janitor.Start(ctx)

	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50056"
	}
	lis, err := net.Listen("tcp", "0.0.0.0:"+grpcPort)
	if err != nil {
		log.Fatalf("failed to listen on gRPC port: %v", err)
	}

	caCert := os.Getenv("MTLS_CA_CERT")
	serverCert := os.Getenv("MTLS_SERVER_CERT")
	serverKey := os.Getenv("MTLS_SERVER_KEY")

	var grpcServer *grpc.Server
	if caCert != "" && serverCert != "" && serverKey != "" {
		creds, err := grpcauth.LoadServerTLSCredentials(caCert, serverCert, serverKey)
		if err != nil {
			log.Fatalf("failed to load TLS credentials: %v", err)
		}
		grpcServer = grpc.NewServer(
			grpc.Creds(creds),
			grpc.UnaryInterceptor(grpcauth.AuthInterceptor(grpcauth.GlobalPolicy)),
		)
		log.Println("gRPC server initialized with mTLS and Auth interceptor.")
	} else {
		log.Println("WARNING: Starting insecure gRPC server (no mTLS certs provided)")
		grpcServer = grpc.NewServer()
	}

	readGrpcHandler := grpcserver.NewWebhookReadServer(repo)
	pb.RegisterWebhookReadServiceServer(grpcServer, readGrpcHandler)

	go func() {
		log.Printf("Webhook Read gRPC server listening at %v", lis.Addr())
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	log.Println("Webhook Service is running.")
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Shutting down Webhook Service...")
	cancel()
}

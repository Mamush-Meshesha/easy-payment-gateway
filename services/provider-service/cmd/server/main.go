package main

import (
	"context"
	"log"
	"net"
	"os"
	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/go-observability"
	"payment-gateway/provider-service/internal/domain"
	grpchandler "payment-gateway/provider-service/internal/handler/grpc"
	"payment-gateway/provider-service/internal/handler/http"
	"payment-gateway/provider-service/internal/infrastructure/router"
	"payment-gateway/provider-service/internal/repository"
	"payment-gateway/provider-service/internal/service"
	pb "payment-gateway/provider-service/proto"

	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	// Initialize Observability
	tp, err := observability.InitTracing("provider-service")
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
		dsn = "host=localhost user=postgres password=postgres dbname=provider_db port=5433 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// AutoMigrate the schema
	err = db.AutoMigrate(&domain.Provider{}, &domain.ProviderCapability{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Dependency Injection
	providerRepo := repository.NewProviderRepository(db)
	providerService := service.NewProviderService(providerRepo)
	providerHttpHandler := http.NewProviderHandler(providerService)
	providerGrpcHandler := grpchandler.NewProviderGrpcServer(providerService)

	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50055"
	}
	lis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("failed to listen on gRPC port: %v", err)
	}

	// mTLS and Interceptor Setup
	caCert := os.Getenv("MTLS_CA_CERT")
	serverCert := os.Getenv("MTLS_SERVER_CERT")
	serverKey := os.Getenv("MTLS_SERVER_KEY")

	var grpcServer *grpc.Server
	if caCert != "" && serverCert != "" && serverKey != "" {
		creds, err := grpcauth.LoadServerTLSCredentials(caCert, serverCert, serverKey)
		if err == nil {
			grpcServer = grpc.NewServer(
				grpc.Creds(creds),
				grpc.UnaryInterceptor(grpcauth.AuthInterceptor(grpcauth.GlobalPolicy)),
			)
		} else {
			log.Printf("TLS credentials could not be loaded: %v, falling back to insecure", err)
		}
	}
	if grpcServer == nil {
		grpcServer = grpc.NewServer()
	}

	pb.RegisterProviderServiceServer(grpcServer, providerGrpcHandler)

	go func() {
		log.Printf("gRPC server listening on port %s", grpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// HTTP Router Setup
	r := router.SetupRouter(providerHttpHandler)

	port := os.Getenv("SERVICE_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "8087" // provider service port
	}

	log.Printf("Provider service starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

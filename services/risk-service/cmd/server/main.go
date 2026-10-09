package main

import (
	"context"
	"log"
	"net"
	"os"
	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/go-observability"
	"payment-gateway/risk-service/internal/cache"
	"payment-gateway/risk-service/internal/domain"
	grpchandler "payment-gateway/risk-service/internal/handler/grpc"
	"payment-gateway/risk-service/internal/handler/http"
	"payment-gateway/risk-service/internal/infrastructure/router"
	"payment-gateway/risk-service/internal/repository"
	"payment-gateway/risk-service/internal/service"
	pb "payment-gateway/risk-service/proto"

	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	// Initialize Observability
	tp, err := observability.InitTracing("risk-service")
	if err != nil {
		log.Fatalf("failed to initialize tracing: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	// Database Setup
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=risk_db port=5433 sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	db.AutoMigrate(&domain.RiskRule{}, &domain.RiskDecision{})

	// Redis Setup
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("failed to parse redis url: %v", err)
	}
	redisClient := redis.NewClient(opt)

	// Dependency Injection
	riskRepo := repository.NewRiskRepository(db)
	velocityCache := cache.NewRedisVelocityCache(redisClient)
	ruleEvaluator := service.NewRuleEvaluator()
	riskService := service.NewRiskService(riskRepo, velocityCache, ruleEvaluator)

	riskHttpHandler := http.NewRiskHandler(riskService)
	riskGrpcHandler := grpchandler.NewRiskGrpcServer(riskService)

	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50054"
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

	pb.RegisterRiskServiceServer(grpcServer, riskGrpcHandler)

	go func() {
		log.Printf("gRPC server listening on port %s", grpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// HTTP Router Setup
	r := router.SetupRouter(riskHttpHandler)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}

	log.Printf("HTTP server listening on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}

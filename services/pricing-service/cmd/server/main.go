package main

import (
	"log"
	"net"
	"os"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	grpcauth "payment-gateway/go-grpc-auth"
	grpc_handler "payment-gateway/pricing-service/internal/handler/grpc"
	"payment-gateway/pricing-service/internal/infrastructure/db"
	"payment-gateway/pricing-service/internal/service"
	pb "payment-gateway/pricing-service/pb"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "host=localhost user=postgres password=postgres dbname=pricing_db port=5433 sslmode=disable"
	}

	repo, err := db.NewPricingRepository(dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	engine := service.NewPricingEngine(repo)
	handler := grpc_handler.NewPricingGrpcHandler(engine)

	caCert := os.Getenv("MTLS_CA_CERT")
	if caCert == "" {
		caCert = "../../infra/certs/ca.crt"
	}
	serverCert := os.Getenv("MTLS_SERVER_CERT")
	serverKey := os.Getenv("MTLS_SERVER_KEY")

	tlsCredentials, err := grpcauth.LoadServerTLSCredentials(
		caCert,
		serverCert,
		serverKey,
	)
	if err != nil {
		log.Fatalf("Failed to load TLS credentials: %v", err)
	}

	server := grpc.NewServer(grpc.Creds(tlsCredentials))
	pb.RegisterPricingServiceServer(server, handler)
	reflection.Register(server)

	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "50058"
	}

	listener, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("Pricing Service gRPC listening on %s (mTLS)", port)
	if err := server.Serve(listener); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

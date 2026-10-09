package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"

	grpc_auth "payment-gateway/go-grpc-auth"
	vault_grpc "payment-gateway/vault-service/internal/handler/grpc"
	pb "payment-gateway/vault-service/proto"
)

func main() {
	log.Println("Starting Vault Service...")

	caCert := os.Getenv("MTLS_CA_CERT")
	serverCert := os.Getenv("MTLS_SERVER_CERT")
	serverKey := os.Getenv("MTLS_SERVER_KEY")

	creds, err := grpc_auth.LoadServerTLSCredentials(caCert, serverCert, serverKey)
	if err != nil {
		log.Fatalf("failed to load TLS credentials: %v", err)
	}

	// 2. Create gRPC Server
	grpcServer := grpc.NewServer(
		grpc.Creds(creds),
		grpc.UnaryInterceptor(grpc_auth.AuthInterceptor(grpc_auth.GlobalPolicy)),
	)

	// 3. Register Health Check
	healthCheck := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthCheck)

	// 4. Register Vault Service
	vaultServer := vault_grpc.NewVaultGrpcServer()
	pb.RegisterVaultServiceServer(grpcServer, vaultServer)

	// 5. Start Listening
	port := os.Getenv("PORT")
	if port == "" {
		port = "50059"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	go func() {
		log.Printf("Vault Service listening on port %s", port)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Vault Service shutting down...")
	healthCheck.Shutdown()
	grpcServer.GracefulStop()
}

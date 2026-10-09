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
	routing_grpc "payment-gateway/routing-service/internal/handler/grpc"
	pb "payment-gateway/routing-service/proto"
)

func main() {
	log.Println("Starting Routing Service...")

	caCert := os.Getenv("MTLS_CA_CERT")
	serverCert := os.Getenv("MTLS_SERVER_CERT")
	serverKey := os.Getenv("MTLS_SERVER_KEY")

	creds, err := grpc_auth.LoadServerTLSCredentials(caCert, serverCert, serverKey)
	if err != nil {
		log.Fatalf("failed to load TLS credentials: %v", err)
	}

	grpcServer := grpc.NewServer(
		grpc.Creds(creds),
		grpc.UnaryInterceptor(grpc_auth.AuthInterceptor(grpc_auth.GlobalPolicy)),
	)

	healthCheck := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthCheck)

	routingServer := routing_grpc.NewRoutingGrpcServer()
	pb.RegisterRoutingServiceServer(grpcServer, routingServer)

	port := os.Getenv("SERVICE_PORT")
	if port == "" {
		port = "50066"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	go func() {
		log.Printf("Routing Service listening on port %s", port)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Routing Service shutting down...")
	healthCheck.Shutdown()
	grpcServer.GracefulStop()
}

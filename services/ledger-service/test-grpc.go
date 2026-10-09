package main

import (
	"context"
	"fmt"
	"log"
	pbLedger "payment-gateway/ledger-service/proto"
	grpcauth "payment-gateway/go-grpc-auth"
	"google.golang.org/grpc"
)

func main() {
	caCert := "../../infra/certs/ca.crt"
	clientCert := "../../infra/certs/payment-service.crt"
	clientKey := "../../infra/certs/payment-service.key"
	creds, err := grpcauth.LoadTLSCredentials(caCert, clientCert, clientKey)
	if err != nil {
		log.Fatalf("creds err: %v", err)
	}
	conn, err := grpc.Dial("localhost:50053", grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("dial err: %v", err)
	}
	defer conn.Close()
	client := pbLedger.NewLedgerServiceClient(conn)
	req := &pbLedger.RecordJournalEntryRequest{
		ReferenceType: "PAYMENT",
		ReferenceId: "01a11264-c9ca-7b1a-a6a0-611f185a9cf1",
		Currency: "ETB",
		Environment: "LIVE",
		Lines: []*pbLedger.JournalLineRequest{
			{AccountId: "11111111-1111-1111-1111-111111111111", Amount: 100, Direction: "DEBIT"},
			{AccountId: "22222222-2222-2222-2222-222222222222", Amount: 50, Direction: "CREDIT"},
			{AccountId: "33333333-3333-3333-3333-333333333333", Amount: 50, Direction: "CREDIT"},
		},
	}
	res, err := client.RecordJournalEntry(context.Background(), req)
	fmt.Printf("res: %+v, err: %v\n", res, err)
}

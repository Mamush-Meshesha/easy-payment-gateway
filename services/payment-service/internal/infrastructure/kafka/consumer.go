package kafka

import (
	"context"
	"encoding/json"
	"log"
	"payment-gateway/payment-service/internal/domain"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
)

type TransactionStatusUpdatedEvent struct {
	TransactionID         string `json:"transactionId"`
	PaymentID             string `json:"paymentId"`
	ProviderID            string `json:"providerId"`
	ProviderTransactionID string `json:"providerTransactionId"`
	Status                string `json:"status"` // SUCCESS or FAILED
	Amount                int64  `json:"amount"`
	Currency              string `json:"currency"`
	Timestamp             string `json:"timestamp"`
}

type TransactionStatusConsumer struct {
	reader *kafka.Reader
	orchestrator domain.PaymentOrchestrator
}

func NewTransactionStatusConsumer(brokers []string, topic string, groupID string, orchestrator domain.PaymentOrchestrator) *TransactionStatusConsumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MaxBytes: 10e6,
	})

	return &TransactionStatusConsumer{
		reader:       r,
		orchestrator: orchestrator,
	}
}

func (c *TransactionStatusConsumer) Start(ctx context.Context) {
	log.Printf("Starting TransactionStatusConsumer on topic: %s", c.reader.Config().Topic)
	for {
		select {
		case <-ctx.Done():
			c.reader.Close()
			return
		default:
			m, err := c.reader.ReadMessage(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				log.Printf("Error reading message: %v", err)
				time.Sleep(1 * time.Second)
				continue
			}

			var event TransactionStatusUpdatedEvent
			if err := json.Unmarshal(m.Value, &event); err != nil {
				log.Printf("Failed to unmarshal transaction event: %v", err)
				continue
			}

			paymentID, err := uuid.Parse(event.PaymentID)
			if err != nil {
				log.Printf("Invalid payment ID format: %v", err)
				continue
			}

			if err := c.orchestrator.ResolvePaymentStatus(ctx, paymentID, event.Status, event.ProviderID, event.ProviderTransactionID); err != nil {
				log.Printf("Failed to resolve payment status for %s: %v", paymentID, err)
			}
		}
	}
}

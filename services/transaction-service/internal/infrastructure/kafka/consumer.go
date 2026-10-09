package kafka

import (
	"context"
	"encoding/json"
	"log"
	"payment-gateway/transaction-service/internal/domain"
	"time"

	"github.com/segmentio/kafka-go"

	"crypto/tls"
	"github.com/segmentio/kafka-go/sasl/scram"
	"os"
)

type ProviderEventConsumer struct {
	reader  *kafka.Reader
	service domain.TransactionService
}

func NewProviderEventConsumer(brokers []string, topic string, groupID string, service domain.TransactionService) *ProviderEventConsumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MaxBytes: 10e6, // 10MB

		Dialer: getKafkaDialerConsumer(),
	})

	return &ProviderEventConsumer{
		reader:  r,
		service: service,
	}
}

func (c *ProviderEventConsumer) Start(ctx context.Context) {
	log.Printf("Starting ProviderEventConsumer on topic: %s", c.reader.Config().Topic)
	for {
		select {
		case <-ctx.Done():
			log.Println("Context done, stopping ProviderEventConsumer")
			c.reader.Close()
			return
		default:
			// Using FetchMessage instead of ReadMessage to allow manual commit if needed,
			// but ReadMessage handles auto-commit on success.
			m, err := c.reader.ReadMessage(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				log.Printf("Error reading message: %v", err)
				time.Sleep(1 * time.Second)
				continue
			}

			var event domain.ProviderNormalizedEvent
			if err := json.Unmarshal(m.Value, &event); err != nil {
				log.Printf("Failed to unmarshal provider event: %v", err)
				continue // skip poison pill
			}

			if err := c.service.ProcessProviderEvent(ctx, event); err != nil {
				log.Printf("Failed to process provider event: %v", err)
				// In a robust system, we would NOT skip here but retry with backoff.
				// For the scope of this implementation, we log the error.
				// Note: ErrStaleEvent returns nil in the service layer, so this only logs real errors.
			}
		}
	}
}

func getKafkaDialerConsumer() *kafka.Dialer {
	username := os.Getenv("KAFKA_SASL_USERNAME")
	password := os.Getenv("KAFKA_SASL_PASSWORD")
	if username != "" && password != "" {
		mechanism, _ := scram.Mechanism(scram.SHA256, username, password)
		return &kafka.Dialer{
			Timeout:       10 * time.Second,
			DualStack:     true,
			SASLMechanism: mechanism,
			TLS:           &tls.Config{InsecureSkipVerify: true},
		}
	}
	return nil
}

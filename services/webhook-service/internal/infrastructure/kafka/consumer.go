package kafka

import (
	"context"
	"encoding/json"
	"log"
	"payment-gateway/webhook-service/internal/domain"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"

	"crypto/tls"
	"github.com/segmentio/kafka-go/sasl/scram"
	"os"
)

type PaymentEventConsumer struct {
	reader *kafka.Reader
	repo   domain.WebhookRepository
}

func NewPaymentEventConsumer(brokers []string, topic string, groupID string, repo domain.WebhookRepository) *PaymentEventConsumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MaxBytes: 10e6,

		Dialer: getKafkaDialerConsumer(),
	})

	return &PaymentEventConsumer{
		reader: r,
		repo:   repo,
	}
}

func (c *PaymentEventConsumer) Start(ctx context.Context) {
	log.Printf("Starting PaymentEventConsumer on topic: %s", c.reader.Config().Topic)
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

			var event domain.PaymentStatusChangedEvent
			if err := json.Unmarshal(m.Value, &event); err != nil {
				log.Printf("Failed to unmarshal payment event: %v", err)
				continue
			}

			paymentID, err := uuid.Parse(event.PaymentID)
			if err != nil {
				log.Printf("Invalid payment ID format: %v", err)
				continue
			}

			merchantID, err := uuid.Parse(event.MerchantID)
			if err != nil {
				log.Printf("Invalid merchant ID format: %v", err)
				continue
			}

			// We use the Kafka Offset / eventID ideally.
			// But since the orchestrator doesn't natively generate a stable eventID in Outbox,
			// we can hash the message key or use a UUID derived from it.
			// Let's assume m.Key is a UUID. If not, generate a deterministic UUID.
			eventID, err := uuid.Parse(string(m.Key))
			if err != nil {
				// Fallback to deterministic UUID based on payload to maintain idempotency
				eventID = uuid.NewSHA1(uuid.NameSpaceOID, m.Value)
			}

			canonicalPayload := domain.CanonicalDeliveryEnvelope{
				EventID:           eventID.String(),
				EventType:         "payment.status.changed",
				EventVersion:      1,
				PaymentID:         event.PaymentID,
				MerchantReference: event.MerchantReference,
				Status:            event.NewStatus,
				Amount:            event.Amount,
				Currency:          event.Currency,
				OccurredAt:        event.Timestamp,
			}

			env := event.Environment
			if env == "" {
				env = "LIVE"
			}

			delivery := &domain.Delivery{
				ID:           eventID,
				Environment:  env,
				EventType:    canonicalPayload.EventType,
				EventVersion: canonicalPayload.EventVersion,
				PaymentID:    paymentID,
				MerchantID:   merchantID,
				URL:          "", // will be fetched by dispatcher
				Status:       domain.StatePending,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			}

			if err := delivery.SetPayload(canonicalPayload); err != nil {
				log.Printf("Failed to set canonical payload: %v", err)
				continue
			}

			inserted, err := c.repo.IdempotentInsertDelivery(ctx, delivery)
			if err != nil {
				log.Printf("Failed to insert delivery for %s: %v", eventID, err)
			} else if !inserted {
				// Safely ignored
				// log.Printf("Delivery %s already exists, idempotent skip", eventID)
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

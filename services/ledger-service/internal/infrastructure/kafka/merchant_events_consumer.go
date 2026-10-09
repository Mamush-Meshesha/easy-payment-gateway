package kafka

import (
	"context"
	"encoding/json"
	"log"
	"payment-gateway/ledger-service/internal/domain"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"

	"crypto/tls"
	"github.com/segmentio/kafka-go/sasl/scram"
	"os"
)

type MerchantEventEnvelope struct {
	EventID   string          `json:"eventId"`
	EventType string          `json:"eventType"`
	Payload   json.RawMessage `json:"payload"`
}

type MerchantStatusChangedEvent struct {
	MerchantID     string `json:"merchantId"`
	PreviousStatus string `json:"previousStatus"`
	NewStatus      string `json:"newStatus"`
}

type MerchantEventsConsumer struct {
	reader  *kafka.Reader
	service domain.LedgerService
}

func NewMerchantEventsConsumer(brokers []string, topic string, groupID string, service domain.LedgerService) *MerchantEventsConsumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MaxBytes: 10e6,

		Dialer: getKafkaDialerMerchanteventsconsumer(),
	})

	return &MerchantEventsConsumer{
		reader:  r,
		service: service,
	}
}

func (c *MerchantEventsConsumer) Start(ctx context.Context) {
	log.Printf("Starting MerchantEventsConsumer on topic: %s", c.reader.Config().Topic)
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

			var envelope MerchantEventEnvelope
			if err := json.Unmarshal(m.Value, &envelope); err != nil {
				log.Printf("Failed to unmarshal merchant event envelope: %v", err)
				continue
			}

			if envelope.EventType != "merchant.status.changed" {
				// Ignore other events on this topic
				continue
			}

			var event MerchantStatusChangedEvent
			if err := json.Unmarshal(envelope.Payload, &event); err != nil {
				log.Printf("Failed to unmarshal merchant.status.changed event payload: %v", err)
				continue
			}

			if event.NewStatus == "SUSPENDED" {
				merchantID, err := uuid.Parse(event.MerchantID)
				if err != nil {
					log.Printf("Invalid merchant ID format: %v", err)
					continue
				}

				if err := c.service.FreezeAccounts(ctx, merchantID); err != nil {
					log.Printf("Failed to freeze accounts for merchant %s: %v", merchantID, err)
				} else {
					log.Printf("Successfully froze accounts for suspended merchant %s", merchantID)
				}
			}
		}
	}
}

func getKafkaDialerMerchanteventsconsumer() *kafka.Dialer {
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

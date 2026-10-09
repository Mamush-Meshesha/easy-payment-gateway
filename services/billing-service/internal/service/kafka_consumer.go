package service

import (
	"context"
	"encoding/json"
	"log"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"

	"payment-gateway/billing-service/internal/domain"

	"crypto/tls"
	"github.com/segmentio/kafka-go/sasl/scram"
	"os"
	"time"
)

type PaymentEvent struct {
	PaymentID  uuid.UUID `json:"payment_id"`
	MerchantID uuid.UUID `json:"merchant_id"`
	Status     string    `json:"status"`
}

type BillingKafkaConsumer struct {
	repo   domain.BillingRepository
	reader *kafka.Reader
}

func NewBillingKafkaConsumer(repo domain.BillingRepository, brokers []string) *BillingKafkaConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: brokers,
		Topic:   "payment.status.updated",
		GroupID: "billing-service-group",

		Dialer: getKafkaDialerKafkaconsumer(),
	})
	return &BillingKafkaConsumer{repo: repo, reader: reader}
}

func (c *BillingKafkaConsumer) Start(ctx context.Context) {
	log.Println("Starting Billing Kafka Consumer on topic payment.status.updated")
	for {
		m, err := c.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("Error reading kafka message: %v\n", err)
			continue
		}

		var event PaymentEvent
		if err := json.Unmarshal(m.Value, &event); err != nil {
			log.Printf("Failed to unmarshal payment event: %v\n", err)
			continue
		}

		c.handlePaymentStatusUpdated(event)
	}
}

func (c *BillingKafkaConsumer) handlePaymentStatusUpdated(event PaymentEvent) {
	invoice, err := c.repo.GetInvoiceByPaymentID(event.PaymentID)
	if err != nil {
		// Not all payments are from invoices, so this is expected for checkout payments
		return
	}

	log.Printf("Received payment status update for Invoice %s: %s\n", invoice.ID, event.Status)

	if event.Status == "SUCCEEDED" {
		c.repo.UpdateInvoiceStatus(invoice.ID, domain.InvoiceStatusPaid, nil)
		// If subscription was past due, revert to active
		sub, _ := c.repo.GetSubscription(invoice.SubscriptionID)
		if sub != nil && sub.Status == domain.SubscriptionStatusPastDue {
			c.repo.UpdateSubscriptionStatus(sub.ID, domain.SubscriptionStatusActive)
		}
	} else if event.Status == "FAILED" {
		c.repo.UpdateSubscriptionStatus(invoice.SubscriptionID, domain.SubscriptionStatusPastDue)
	}
}

func getKafkaDialerKafkaconsumer() *kafka.Dialer {
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

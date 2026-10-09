package kafka

import (
	"context"
	"log"
	"payment-gateway/transaction-service/internal/domain"
	"time"

	"github.com/segmentio/kafka-go"
	"gorm.io/gorm"

	"crypto/tls"
	"github.com/segmentio/kafka-go/sasl/scram"
	"os"
)

type OutboxRelayWorker struct {
	db     *gorm.DB
	writer *kafka.Writer
	topic  string
}

func NewOutboxRelayWorker(db *gorm.DB, brokers []string, topic string) *OutboxRelayWorker {
	w := &kafka.Writer{
		Addr:                   kafka.TCP(brokers...),
		Topic:                  topic,
		AllowAutoTopicCreation: true,

		Transport: getKafkaTransport(),
	}
	return &OutboxRelayWorker{
		db:     db,
		writer: w,
		topic:  topic,
	}
}

func (w *OutboxRelayWorker) Start(ctx context.Context) {
	log.Println("Starting Outbox Relay Worker")
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			w.writer.Close()
			return
		case <-ticker.C:
			w.processOutbox(ctx)
		}
	}
}

func (w *OutboxRelayWorker) processOutbox(ctx context.Context) {
	var events []domain.OutboxEvent
	// Fetch up to 50 pending events
	if err := w.db.WithContext(ctx).Where("status = ?", "PENDING").Limit(50).Find(&events).Error; err != nil {
		log.Printf("Failed to fetch outbox events: %v", err)
		return
	}

	if len(events) == 0 {
		return
	}

	var messages []kafka.Message
	for _, e := range events {
		messages = append(messages, kafka.Message{
			Key:   []byte(e.ID.String()), // Ensure partitioning works
			Value: []byte(e.Payload),
		})
	}

	if err := w.writer.WriteMessages(ctx, messages...); err != nil {
		log.Printf("Failed to write to kafka: %v", err)
		return
	}

	// Mark as processed
	var ids []string
	for _, e := range events {
		ids = append(ids, e.ID.String())
	}
	if err := w.db.WithContext(ctx).Model(&domain.OutboxEvent{}).Where("id IN ?", ids).Update("status", "PUBLISHED").Error; err != nil {
		log.Printf("Failed to update outbox event statuses: %v", err)
	}
}

func getKafkaDialer() *kafka.Dialer {
	username := os.Getenv("KAFKA_SASL_USERNAME")
	password := os.Getenv("KAFKA_SASL_PASSWORD")
	if username != "" && password != "" {
		mechanism, _ := scram.Mechanism(scram.SHA256, username, password)
		return &kafka.Dialer{
			Timeout:       10 * time.Second,
			DualStack:     true,
			SASLMechanism: mechanism,
			TLS:           &tls.Config{},
		}
	}
	return nil
}

func getKafkaTransport() *kafka.Transport {
	username := os.Getenv("KAFKA_SASL_USERNAME")
	password := os.Getenv("KAFKA_SASL_PASSWORD")
	if username != "" && password != "" {
		mechanism, _ := scram.Mechanism(scram.SHA256, username, password)
		return &kafka.Transport{
			SASL: mechanism,
			TLS:  &tls.Config{},
		}
	}
	return nil
}

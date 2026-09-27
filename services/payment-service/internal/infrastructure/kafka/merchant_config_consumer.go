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

type MerchantEventEnvelope struct {
	EventID   string          `json:"eventId"`
	EventType string          `json:"eventType"`
	Payload   json.RawMessage `json:"payload"`
}

type MerchantConfigUpdatedEvent struct {
	MerchantID            string   `json:"merchant_id"`
	Version               int      `json:"version"`
	FeeRouting            string   `json:"fee_routing"`
	EnabledPaymentMethods []string `json:"enabled_payment_methods"`
}

type MerchantConfigConsumer struct {
	reader *kafka.Reader
	cache  domain.MerchantConfigCache
}

func NewMerchantConfigConsumer(brokers []string, topic string, groupID string, cache domain.MerchantConfigCache) *MerchantConfigConsumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MaxBytes: 10e6,
	})

	return &MerchantConfigConsumer{
		reader: r,
		cache:  cache,
	}
}

func (c *MerchantConfigConsumer) Start(ctx context.Context) {
	if c.cache == nil {
		log.Printf("MerchantConfigConsumer: no cache provided, exiting consumer loop")
		return
	}

	log.Printf("Starting MerchantConfigConsumer on topic: %s", c.reader.Config().Topic)
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

			if envelope.EventType != "merchant.config_updated" {
				// Ignore other events on this topic
				continue
			}

			var event MerchantConfigUpdatedEvent
			if err := json.Unmarshal(envelope.Payload, &event); err != nil {
				log.Printf("Failed to unmarshal merchant.config_updated event payload: %v", err)
				continue
			}

			merchantID, err := uuid.Parse(event.MerchantID)
			if err != nil {
				log.Printf("Invalid merchant ID format: %v", err)
				continue
			}

			// Version-gated write: only update the cache if the incoming event
			// is strictly newer than what is currently cached.
			// This protects against out-of-order Kafka delivery (e.g. after a
			// partition rebalance) silently rolling back the cache to stale config,
			// which could re-authorize a payment method that the merchant just disabled.
			if cached, err := c.cache.Get(ctx, merchantID); err == nil && cached != nil {
				if event.Version <= cached.Version {
					log.Printf(
						"MerchantConfigConsumer: skipping stale config event for %s "+
							"(event v%d <= cached v%d)",
						merchantID, event.Version, cached.Version,
					)
					continue
				}
			}

			// The incoming event is newer (or the cache is cold). Write it.
			//
			// We first DELETE the existing entry so there is no window during
			// which a concurrent payment reader could observe the old version
			// between the version-check above and the Set below.
			if err := c.cache.Delete(ctx, merchantID); err != nil {
				log.Printf("MerchantConfigConsumer: failed to invalidate cache for %s: %v", merchantID, err)
				// Proceed to Set anyway — worst case the stale TTL still expires.
			}

			newConfig := domain.MerchantConfig{
				Version:               event.Version,
				FeeRouting:            event.FeeRouting,
				EnabledPaymentMethods: event.EnabledPaymentMethods,
				// CachedAt is stamped by cache.Set, not here.
			}

			if err := c.cache.Set(ctx, merchantID, newConfig, 10*time.Minute); err != nil {
				log.Printf("MerchantConfigConsumer: failed to update cache for %s: %v", merchantID, err)
			} else {
				log.Printf(
					"MerchantConfigConsumer: updated cache for %s to version %d",
					merchantID, event.Version,
				)
			}
		}
	}
}

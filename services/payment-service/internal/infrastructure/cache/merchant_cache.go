package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"payment-gateway/payment-service/internal/domain"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type MerchantConfigCache struct {
	rdb *redis.Client
}

func NewMerchantConfigCache(redisURL string) (*MerchantConfigCache, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid redis url: %v", err)
	}
	rdb := redis.NewClient(opts)
	// Test connection
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %v", err)
	}
	return &MerchantConfigCache{rdb: rdb}, nil
}

func (c *MerchantConfigCache) Get(ctx context.Context, merchantID uuid.UUID) (*domain.MerchantConfig, error) {
	key := fmt.Sprintf("merchant_config:%s", merchantID.String())
	val, err := c.rdb.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Cache miss
		}
		return nil, err
	}

	var config domain.MerchantConfig
	if err := json.Unmarshal([]byte(val), &config); err != nil {
		return nil, err
	}
	return &config, nil
}

// Set stores the config and stamps CachedAt so the orchestrator can measure
// age at read-time for security-boundary enforcement.
func (c *MerchantConfigCache) Set(ctx context.Context, merchantID uuid.UUID, config domain.MerchantConfig, ttl time.Duration) error {
	key := fmt.Sprintf("merchant_config:%s", merchantID.String())
	config.CachedAt = time.Now().UTC()
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}
	return c.rdb.Set(ctx, key, data, ttl).Err()
}

// Delete explicitly removes the cached config for a merchant.
// Called by the Kafka consumer when a config update arrives; the next payment
// will then re-fetch the authoritative value synchronously from merchant-service
// rather than serving a potentially stale cached value.
func (c *MerchantConfigCache) Delete(ctx context.Context, merchantID uuid.UUID) error {
	key := fmt.Sprintf("merchant_config:%s", merchantID.String())
	return c.rdb.Del(ctx, key).Err()
}

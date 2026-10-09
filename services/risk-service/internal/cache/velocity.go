package cache

import (
	"context"
	"payment-gateway/risk-service/internal/domain"

	"github.com/redis/go-redis/v9"
)

// luaVelocityScript atomically increments the key. If it's the first time (count == 1),
// it sets the expiry to window_seconds. It returns the current count.
// KEYS[1] = key
// ARGV[1] = window_seconds
const luaVelocityScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`

type RedisVelocityCache struct {
	client *redis.Client
	script *redis.Script
}

func NewRedisVelocityCache(client *redis.Client) domain.VelocityCache {
	return &RedisVelocityCache{
		client: client,
		script: redis.NewScript(luaVelocityScript),
	}
}

func (c *RedisVelocityCache) IncrementAndCheck(ctx context.Context, key string, windowSeconds int, limit int64) (bool, error) {
	result, err := c.script.Run(ctx, c.client, []string{key}, windowSeconds).Result()
	if err != nil {
		return false, err
	}

	count, ok := result.(int64)
	if !ok {
		return false, nil // Should not happen with INCR
	}

	return count > limit, nil
}

package workers

import (
	"context"
	"log"
	"payment-gateway/payment-service/internal/domain"
	"time"
)

type IdempotencyPruner struct {
	repo     domain.PaymentRepository
	interval time.Duration
	retentionDays int
}

func NewIdempotencyPruner(repo domain.PaymentRepository, interval time.Duration, retentionDays int) *IdempotencyPruner {
	return &IdempotencyPruner{
		repo:          repo,
		interval:      interval,
		retentionDays: retentionDays,
	}
}

func (p *IdempotencyPruner) Start(ctx context.Context) {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	log.Printf("Starting Idempotency Pruner (Interval: %v, Retention: %d days)", p.interval, p.retentionDays)

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping Idempotency Pruner...")
			return
		case <-ticker.C:
			p.prune(ctx)
		}
	}
}

func (p *IdempotencyPruner) prune(ctx context.Context) {
	olderThan := time.Now().AddDate(0, 0, -p.retentionDays)
	
	log.Printf("Pruning idempotency keys older than %v", olderThan)
	
	deletedCount, err := p.repo.PruneIdempotencyKeys(ctx, olderThan)
	if err != nil {
		log.Printf("Error pruning idempotency keys: %v", err)
		return
	}
	
	log.Printf("Successfully pruned %d idempotency keys", deletedCount)
}

package workers

import (
	"context"
	"log"
	"payment-gateway/webhook-service/internal/domain"
	"time"
)

type JanitorWorker struct {
	repo domain.WebhookRepository
}

func NewJanitorWorker(repo domain.WebhookRepository) *JanitorWorker {
	return &JanitorWorker{
		repo: repo,
	}
}

func (w *JanitorWorker) Start(ctx context.Context) {
	log.Println("Starting Webhook Janitor")
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			count, err := w.repo.UnlockStaleDeliveries(ctx, 2) // 2 minutes timeout
			if err != nil {
				log.Printf("Failed to unlock stale deliveries: %v", err)
			} else if count > 0 {
				log.Printf("Janitor recovered %d stale deliveries", count)
			}
		}
	}
}

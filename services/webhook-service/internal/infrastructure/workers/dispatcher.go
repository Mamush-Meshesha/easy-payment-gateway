package workers

import (
	"context"
	"log"
	"payment-gateway/webhook-service/internal/domain"
	"payment-gateway/webhook-service/internal/service"
	"sync"
	"time"

	"github.com/google/uuid"
)

type DispatcherWorker struct {
	repo        domain.WebhookRepository
	service     *service.DispatcherService
	workerID    string
	batchSize   int
	concurrency int
}

func NewDispatcherWorker(repo domain.WebhookRepository, service *service.DispatcherService) *DispatcherWorker {
	return &DispatcherWorker{
		repo:        repo,
		service:     service,
		workerID:    "worker-" + uuid.New().String(),
		batchSize:   50,
		concurrency: 10,
	}
}

func (w *DispatcherWorker) Start(ctx context.Context) {
	log.Printf("Starting Webhook Dispatcher %s", w.workerID)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.processBatch(ctx)
		}
	}
}

func (w *DispatcherWorker) processBatch(ctx context.Context) {
	deliveries, err := w.repo.ClaimDeliveries(ctx, w.workerID, w.batchSize)
	if err != nil {
		log.Printf("Failed to claim deliveries: %v", err)
		return
	}

	if len(deliveries) == 0 {
		return
	}

	sem := make(chan struct{}, w.concurrency)
	var wg sync.WaitGroup

	for i := range deliveries {
		delivery := deliveries[i] // local copy
		wg.Add(1)
		sem <- struct{}{}

		go func(d *domain.Delivery) {
			defer wg.Done()
			defer func() { <-sem }()

			if err := w.service.ProcessDelivery(ctx, d); err != nil {
				log.Printf("Error processing delivery %s: %v", d.ID, err)
			}
		}(&delivery)
	}

	wg.Wait()
}

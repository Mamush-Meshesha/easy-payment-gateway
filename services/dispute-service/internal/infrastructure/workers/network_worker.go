package workers

import (
	"context"
	"log"
	"time"

	"payment-gateway/dispute-service/internal/domain"
	"payment-gateway/dispute-service/internal/service"
)

// NetworkWorker simulates polling Visa VROL / MasterCom APIs for new chargebacks
// and network decisions on existing disputes.
type NetworkWorker struct {
	orchestrator *service.DisputeOrchestrator
}

func NewNetworkWorker(orchestrator *service.DisputeOrchestrator) *NetworkWorker {
	return &NetworkWorker{
		orchestrator: orchestrator,
	}
}

func (w *NetworkWorker) Start(ctx context.Context) {
	log.Println("Starting Dispute NetworkWorker (Visa/Mastercard integration)")

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping Dispute NetworkWorker")
			return
		case <-ticker.C:
			w.pollNetworkAPIs(ctx)
		}
	}
}

func (w *NetworkWorker) pollNetworkAPIs(ctx context.Context) {
	// In a real Tier-1 integration, this would call VROL / MasterCom SOAP/REST endpoints.
	// For this architecture demo, we occasionally check if there are any disputes
	// stuck in "UNDER_REVIEW" and automatically simulate a network decision (WON/LOST).

	disputes, err := w.orchestrator.GetDisputesByStatus(domain.DisputeStatusUnderReview)
	if err != nil {
		log.Printf("NetworkWorker: failed to fetch disputes under review: %v", err)
		return
	}

	if len(disputes) > 0 {
		log.Printf("NetworkWorker: Polling Visa/Mastercard for %d disputes under review...", len(disputes))
	}

	for _, d := range disputes {
		// Simulate VROL response delay/decision based on time elapsed since dispute creation
		// Let's just resolve it if it's been under review for a mock period,
		// but for demo purposes, we will resolve it immediately in half the cases.

		won := d.Amount%2 == 0 // Pseudo-random: even amount = win, odd amount = lose

		log.Printf("NetworkWorker: Received VROL decision for dispute %s -> WON: %v", d.ID, won)

		if err := w.orchestrator.ResolveDispute(d.ID, won); err != nil {
			log.Printf("NetworkWorker: Failed to resolve dispute %s: %v", d.ID, err)
		} else {
			log.Printf("NetworkWorker: Dispute %s resolved. Ledger reversed/released successfully.", d.ID)
		}
	}
}

package service

import (
	"log"
	"time"

	"github.com/google/uuid"
	"payment-gateway/billing-service/internal/domain"
)

type BillingOrchestrator struct {
	repo          domain.BillingRepository
	paymentClient domain.PaymentClient
}

func NewBillingOrchestrator(repo domain.BillingRepository, pc domain.PaymentClient) *BillingOrchestrator {
	return &BillingOrchestrator{
		repo:          repo,
		paymentClient: pc,
	}
}

func (s *BillingOrchestrator) ProcessDueSubscriptions() {
	log.Println("Starting autonomous subscription billing cycle...")
	subs, err := s.repo.GetDueSubscriptions(time.Now())
	if err != nil {
		log.Printf("Failed to get due subscriptions: %v\n", err)
		return
	}

	for _, sub := range subs {
		log.Printf("Processing Subscription ID: %s for Customer: %s\n", sub.ID, sub.CustomerID)

		// 1. Generate an Invoice
		invoice := &domain.Invoice{
			ID:             uuid.Must(uuid.NewV7()),
			SubscriptionID: sub.ID,
			MerchantID:     sub.MerchantID,
			CustomerID:     sub.CustomerID,
			Amount:         sub.Plan.Amount,
			Currency:       sub.Plan.Currency,
			Status:         domain.InvoiceStatusOpen,
			DueDate:        time.Now().Add(24 * time.Hour), // 1 day grace
		}

		if err := s.repo.CreateInvoice(invoice); err != nil {
			log.Printf("Failed to create invoice for sub %s: %v\n", sub.ID, err)
			continue
		}

		// 2. Execute Payment synchronously (or enqueue)
		// For autonomous billing, we execute the payment against the vaulted card
		paymentID, err := s.paymentClient.ExecutePayment(
			sub.MerchantID,
			sub.DefaultPaymentMethodID,
			invoice.Amount,
			invoice.Currency,
			"invoice_"+invoice.ID.String(),
		)

		if err != nil {
			log.Printf("Failed to execute payment for invoice %s: %v\n", invoice.ID, err)
			// The invoice stays OPEN, the subscription is PAST_DUE
			s.repo.UpdateSubscriptionStatus(sub.ID, domain.SubscriptionStatusPastDue)
			continue
		}

		// Payment initiated (it might be async pending or synchronous success depending on provider)
		// The final state resolution (PAID vs FAILED) is handled by the Kafka consumer listening to payment.status.updated
		// For now, we just link it.
		s.repo.UpdateInvoiceStatus(invoice.ID, domain.InvoiceStatusOpen, paymentID)

		// Advance the billing period eagerly. If the payment fails later, the Kafka consumer will revert this or mark PAST_DUE
		var nextStart, nextEnd time.Time
		if sub.Plan.Interval == "MONTHLY" {
			nextStart = sub.CurrentPeriodEnd
			nextEnd = sub.CurrentPeriodEnd.AddDate(0, 1, 0)
		} else { // YEARLY
			nextStart = sub.CurrentPeriodEnd
			nextEnd = sub.CurrentPeriodEnd.AddDate(1, 0, 0)
		}

		s.repo.UpdateSubscriptionPeriod(sub.ID, nextStart, nextEnd)
		log.Printf("Successfully processed subscription %s and generated invoice %s\n", sub.ID, invoice.ID)
	}
}

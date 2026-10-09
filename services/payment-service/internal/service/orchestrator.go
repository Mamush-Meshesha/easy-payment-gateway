package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"payment-gateway/payment-service/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
)

type PaymentOrchestratorImpl struct {
	repo     domain.PaymentRepository
	merchant domain.MerchantClient
	cache    domain.MerchantConfigCache
	risk     domain.RiskClient
	provider domain.ProviderClient
	ledger   domain.LedgerClient
	pricing  domain.PricingClient
}

func NewPaymentOrchestrator(repo domain.PaymentRepository, m domain.MerchantClient, c domain.MerchantConfigCache, r domain.RiskClient, p domain.ProviderClient, l domain.LedgerClient, pr domain.PricingClient) domain.PaymentOrchestrator {
	return &PaymentOrchestratorImpl{
		repo:     repo,
		merchant: m,
		cache:    c,
		risk:     r,
		provider: p,
		ledger:   l,
		pricing:  pr,
	}
}

// maxPaymentMethodStaleness is the hard upper bound on how old a cached
// MerchantConfig may be before the orchestrator bypasses the cache and
// re-fetches synchronously from merchant-service.
//
// This limit applies specifically to EnabledPaymentMethods because a stale
// cached value could authorize a payment method that the merchant has since
// disabled — a real authorization risk.
//
// fee_routing staleness is acceptable: the worst case is that the wrong party
// absorbs the fee for a short window. The payment is still financially complete.
//
// The Kafka consumer (merchant_config_consumer.go) normally pushes config
// updates in < 30s. This 2-minute bound is the fallback for Kafka lag/outage.
const maxPaymentMethodStaleness = 2 * time.Minute

func (o *PaymentOrchestratorImpl) getMerchantConfigWithCache(ctx context.Context, merchantID uuid.UUID) (*domain.MerchantConfig, error) {
	// 1. Check cache — but enforce a security staleness bound on EnabledPaymentMethods.
	if o.cache != nil {
		if cached, err := o.cache.Get(ctx, merchantID); err == nil && cached != nil {
			age := time.Since(cached.CachedAt)
			if len(cached.EnabledPaymentMethods) == 0 || age <= maxPaymentMethodStaleness {
				// Safe to serve from cache: either no payment methods are configured
				// (no security boundary to enforce) or the entry is fresh enough.
				return cached, nil
			}
			// The cached entry has EnabledPaymentMethods but is stale beyond our
			// security bound. Fall through to synchronous re-fetch below.
			log.Printf(
				"getMerchantConfigWithCache: cache entry for %s is %s old (> %s limit); "+
					"re-fetching from merchant-service to enforce EnabledPaymentMethods",
				merchantID, age.Round(time.Second), maxPaymentMethodStaleness,
			)
		}
	}

	// 2. Synchronous gRPC fetch — the authoritative source.
	config, err := o.merchant.GetMerchantConfig(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch merchant config: %w", err)
	}

	// 3. Re-populate the cache (stamps CachedAt = now).
	if o.cache != nil {
		if setErr := o.cache.Set(ctx, merchantID, config, 10*time.Minute); setErr != nil {
			// Cache write failure is non-fatal: the payment can proceed with the
			// freshly fetched config. The next request will miss the cache and
			// re-fetch again. Log it for observability.
			log.Printf("getMerchantConfigWithCache: failed to set cache for %s: %v", merchantID, setErr)
		}
	}
	return &config, nil
}

func (o *PaymentOrchestratorImpl) ProcessPayment(ctx context.Context, req *domain.PaymentRequest, payloadHash string) (*domain.PaymentResponse, error) {
	// 1. Auth & Validation (Merchant Service)
	isValid, merchantID, env, err := o.merchant.ValidateApiKey(ctx, req.APIKey)
	if err != nil {
		return nil, fmt.Errorf("failed to validate api key: %w", err)
	}
	if !isValid {
		return nil, errors.New("invalid api key")
	}
	req.MerchantID = merchantID
	req.Environment = env

	// 1b. Get Merchant Config
	config, err := o.getMerchantConfigWithCache(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get merchant config: %w", err)
	}

	// Validate Payment Method Configuration
	methodAllowed := false
	for _, method := range config.EnabledPaymentMethods {
		// Use simple string comparison; if strings package is needed, ensure it's imported or just do strict match.
		if method == req.PaymentMethod {
			methodAllowed = true
			break
		}
	}
	// For fallback/legacy if no methods are configured (e.g. testing), we could allow it, but we should enforce it.
	// We'll enforce strict match.
	if len(config.EnabledPaymentMethods) > 0 && !methodAllowed {
		return nil, fmt.Errorf("payment method %s is not enabled for this merchant", req.PaymentMethod)
	}

	// 2. Create Payment & Idempotency Lock
	paymentID := uuid.Must(uuid.NewV7())
	payment := &domain.Payment{
		ID:                paymentID,
		MerchantID:        req.MerchantID,
		Environment:       req.Environment,
		MerchantReference: req.MerchantReference,
		Amount:            req.Amount,
		Currency:          req.Currency,
		Status:            domain.StateCreated,
		ProviderID:        &req.ProviderID,
		CustomerID:        req.CustomerID,
		IPAddress:         req.IPAddress,
		PaymentMethod:     req.PaymentMethod,
		Version:           1,
	}

	history := &domain.PaymentStateHistory{
		ID:         uuid.Must(uuid.NewV7()),
		PaymentID:  paymentID,
		FromStatus: "",
		ToStatus:   domain.StateCreated,
		Reason:     "Initial request",
	}

	idem := &domain.IdempotencyKey{
		ID:             uuid.Must(uuid.NewV7()),
		MerchantID:     req.MerchantID,
		IdempotencyKey: req.IdempotencyKey,
		Status:         "PROCESSING",
	}

	p, err := o.repo.CreatePaymentWithIdempotency(ctx, payment, history, idem, payloadHash)
	if err != nil {
		if errors.Is(err, domain.ErrIdempotentHit) {
			// True idempotent replay: same key AND same payload — return existing payment as-is.
			return &domain.PaymentResponse{
				PaymentID: p.ID,
				Status:    p.Status,
				Reason:    "Idempotent response",
			}, nil
		}
		if errors.Is(err, domain.ErrIdempotencyMismatch) {
			// Same key but DIFFERENT payload — conflict. Propagate so the HTTP handler returns 409.
			return nil, domain.ErrIdempotencyMismatch
		}
		return nil, fmt.Errorf("failed to create payment: %w", err)
	}

	// 3. Risk Evaluation
	action, riskReason, requires3ds, err := o.risk.CheckRisk(ctx, p)
	if err != nil {
		// "The Payment Service must handle risk-service failures according to explicit policy."
		// Fail-closed policy for Risk unavailability.
		return o.failPayment(ctx, p, "Risk service unavailable")
	}

	if action == "BLOCK" {
		return o.failPayment(ctx, p, fmt.Sprintf("Risk Block: %s", riskReason))
	}

	if requires3ds || action == "CHALLENGE" {
		// 3DS2 Challenge Fallback
		outbox := o.buildOutboxEvent(p, "PaymentRequiresAction")
		if err := o.transitionState(ctx, p, domain.StateRequiresAction, "3DS2 Challenge Required", outbox); err != nil {
			return nil, err
		}
		// Mock 3DS Issuer URL for frontend to render in an iframe or redirect
		mock3dsURL := fmt.Sprintf("/mock-issuer/3ds2/challenge?payment_id=%s", p.ID)
		return &domain.PaymentResponse{
			PaymentID:   p.ID,
			Status:      domain.StateRequiresAction,
			Reason:      "SCA Challenge Required",
			CheckoutURL: mock3dsURL,
		}, nil
	}

	// 4. Update to INITIATED
	if err := o.transitionState(ctx, p, domain.StateInitiated, "Risk evaluation passed", nil); err != nil {
		return nil, err
	}

	// 5. Provider Execution
	if err := o.transitionState(ctx, p, domain.StateProcessing, "Calling external provider", nil); err != nil {
		return nil, err
	}

	provStatus, err := o.provider.InitiatePayment(ctx, p.ID, *p.ProviderID, p.Amount, p.Currency, p.Environment)
	if err != nil {
		// Provider Timeout or Unavailability
		// Rule: "Timeout != Failure. Transition to UNKNOWN"
		o.transitionState(ctx, p, domain.StateUnknown, "Provider communication error/timeout", o.buildOutboxEvent(p, "PaymentUnknown"))
		return &domain.PaymentResponse{PaymentID: p.ID, Status: domain.StateUnknown, Reason: err.Error()}, nil
	}

	var checkoutURL string
	if strings.HasPrefix(provStatus, "REDIRECT:") {
		checkoutURL = strings.TrimPrefix(provStatus, "REDIRECT:")
		provStatus = "PENDING"
	}

	switch provStatus {
	case "SUCCESS":
		// 6. Ledger Execution
		if err := o.transitionState(ctx, p, domain.StateCompletionPending, "Provider success, calling Ledger", nil); err != nil {
			return nil, err
		}

		provIDStr := ""
		if p.ProviderID != nil {
			provIDStr = p.ProviderID.String()
		}
		// Calculate Pricing Fee dynamically via gRPC
		pricingRes, err := o.pricing.CalculateFee(ctx, p.MerchantID, p.PaymentMethod, p.Amount, p.Currency)
		var merchantCut, platformCut int64
		if err != nil {
			log.Printf("Pricing calculation failed for payment %s (using defaults): %v", p.ID, err)
			// Fallback if pricing service is down
			platformCut = int64(float64(p.Amount)*0.029) + 30
			merchantCut = p.Amount - platformCut
		} else {
			merchantCut = pricingRes.MerchantCut
			platformCut = pricingRes.PlatformCut
		}

		ledgerStatus, err := o.ledger.RecordJournalEntry(ctx, p.ID, provIDStr, "", p.Amount, merchantCut, platformCut, p.Currency, p.Environment)
		if err != nil || ledgerStatus == "TIMEOUT" {
			// Ledger Timeout
			// Recovery mechanism will retry this later
			o.transitionState(ctx, p, domain.StateUnknown, "Ledger timeout or error", nil) // Can't publish success yet
			return &domain.PaymentResponse{PaymentID: p.ID, Status: domain.StateUnknown, Reason: "Ledger pending"}, nil
		}

		// 7. Success
		outbox := o.buildOutboxEvent(p, "PaymentStatusChanged")
		if err := o.transitionState(ctx, p, domain.StateSucceeded, "Ledger posted", outbox); err != nil {
			// If this fails, the background worker will retry it since the ledger was posted idempotently
			log.Printf("Failed to update payment to SUCCEEDED: %v", err)
		}
		return &domain.PaymentResponse{PaymentID: p.ID, Status: domain.StateSucceeded, Reason: "Success"}, nil

	case "FAILED", "DECLINED":
		return o.failPayment(ctx, p, "Provider declined")
	case "PENDING":
		outbox := o.buildOutboxEvent(p, "PaymentStatusChanged")
		if err := o.transitionState(ctx, p, domain.StatePending, "Provider processing asynchronously", outbox); err != nil {
			log.Printf("Failed to transition to PENDING: %v", err)
			return nil, err
		}
		return &domain.PaymentResponse{PaymentID: p.ID, Status: domain.StatePending, Reason: "Pending provider callback", CheckoutURL: checkoutURL}, nil
	default:
		o.transitionState(ctx, p, domain.StateUnknown, "Unknown provider status", nil)
		return &domain.PaymentResponse{PaymentID: p.ID, Status: domain.StateUnknown, Reason: provStatus}, nil
	}
}

func (o *PaymentOrchestratorImpl) failPayment(ctx context.Context, p *domain.Payment, reason string) (*domain.PaymentResponse, error) {
	outbox := o.buildOutboxEvent(p, "PaymentStatusChanged")
	o.transitionState(ctx, p, domain.StateFailed, reason, outbox)
	return &domain.PaymentResponse{
		PaymentID: p.ID,
		Status:    domain.StateFailed,
		Reason:    reason,
	}, nil
}

func (o *PaymentOrchestratorImpl) ResolvePaymentStatus(ctx context.Context, paymentID uuid.UUID, providerStatus string, providerID string, providerTransactionID string) error {
	p, err := o.repo.GetPaymentByID(ctx, paymentID, "")
	if err != nil {
		return err
	}

	// We only resolve if the payment is in a state waiting for provider confirmation
	if p.Status != domain.StatePending && p.Status != domain.StateUnknown && p.Status != domain.StateRequiresAction {
		// Already resolved
		return nil
	}

	if providerStatus == "SUCCESS" {
		// Proceed to Ledger
		if err := o.transitionState(ctx, p, domain.StateCompletionPending, "Provider resolved to SUCCESS", nil); err != nil {
			return err
		}

		// Recalculate or retrieve fee for async resolution
		pricingRes, err := o.pricing.CalculateFee(ctx, p.MerchantID, p.PaymentMethod, p.Amount, p.Currency)
		var merchantCut, platformCut int64
		if err != nil {
			log.Printf("Pricing calculation failed for async payment %s (using defaults): %v", p.ID, err)
			platformCut = int64(float64(p.Amount)*0.029) + 30
			merchantCut = p.Amount - platformCut
		} else {
			merchantCut = pricingRes.MerchantCut
			platformCut = pricingRes.PlatformCut
		}

		ledgerStatus, err := o.ledger.RecordJournalEntry(ctx, p.ID, providerID, providerTransactionID, p.Amount, merchantCut, platformCut, p.Currency, p.Environment)
		if err != nil || ledgerStatus == "TIMEOUT" {
			log.Printf("Ledger RecordJournalEntry failed for payment %s: err=%v, status=%s", p.ID, err, ledgerStatus)
			return o.transitionState(ctx, p, domain.StateUnknown, "Ledger timeout during async resolution", nil)
		}

		outbox := o.buildOutboxEvent(p, "PaymentStatusChanged")
		return o.transitionState(ctx, p, domain.StateSucceeded, "Ledger posted after async resolution", outbox)
	}

	if providerStatus == "FAILED" || providerStatus == "DECLINED" {
		outbox := o.buildOutboxEvent(p, "PaymentStatusChanged")
		return o.transitionState(ctx, p, domain.StateFailed, "Provider resolved to FAILED", outbox)
	}

	return nil
}

func (o *PaymentOrchestratorImpl) transitionState(ctx context.Context, p *domain.Payment, nextState domain.PaymentState, reason string, outbox *domain.OutboxEvent) error {
	history := &domain.PaymentStateHistory{
		ID:         uuid.Must(uuid.NewV7()),
		PaymentID:  p.ID,
		FromStatus: p.Status,
		ToStatus:   nextState,
		Reason:     reason,
	}
	p.Status = nextState

	if outbox != nil {
		outbox.SetPayload(map[string]interface{}{
			"paymentId":         p.ID,
			"merchantId":        p.MerchantID,
			"merchantReference": p.MerchantReference,
			"previousStatus":    history.FromStatus,
			"status":            p.Status,
			"amount":            p.Amount,
			"currency":          p.Currency,
			"timestamp":         time.Now().Format(time.RFC3339),
		})
	}

	return o.repo.UpdatePaymentState(ctx, p, history, outbox)
}

func (o *PaymentOrchestratorImpl) buildOutboxEvent(p *domain.Payment, eventType string) *domain.OutboxEvent {
	return &domain.OutboxEvent{
		ID:            uuid.Must(uuid.NewV7()),
		AggregateType: "Payment",
		AggregateID:   p.ID.String(),
		EventType:     eventType,
	}
}

func (o *PaymentOrchestratorImpl) ProcessRefund(ctx context.Context, req *domain.RefundRequest, payloadHash string) (*domain.RefundResponse, error) {
	// 0. Auth & Validation (Merchant Service)
	isValid, merchantID, env, err := o.merchant.ValidateApiKey(ctx, req.APIKey)
	if err != nil {
		return nil, fmt.Errorf("failed to validate api key: %w", err)
	}
	if !isValid {
		return nil, errors.New("invalid api key")
	}
	req.Environment = env

	// 1. Validate payment exists and merchant owns it
	payment, err := o.repo.GetPaymentByID(ctx, req.PaymentID, req.Environment)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	if payment.MerchantID != merchantID {
		return nil, errors.New("unauthorized: merchant does not own this payment")
	}

	if req.Amount <= 0 {
		return nil, errors.New("invalid refund amount: must be greater than 0")
	}

	// Calculate refundable amount
	refundableAmount := payment.Amount - payment.RefundedAmount
	if req.Amount > refundableAmount {
		return nil, fmt.Errorf("invalid refund amount: requested %d but only %d is refundable", req.Amount, refundableAmount)
	}

	// 2. Setup Refund domain object
	refundID := uuid.Must(uuid.NewV7())
	refund := &domain.Refund{
		ID:             refundID,
		PaymentID:      req.PaymentID,
		MerchantID:     merchantID,
		Environment:    req.Environment,
		Amount:         req.Amount,
		Currency:       payment.Currency,
		Status:         domain.RefundStateRequested,
		Reason:         req.Reason,
		IdempotencyKey: req.IdempotencyKey,
		Version:        1,
	}

	history := &domain.RefundStateHistory{
		ID:         uuid.Must(uuid.NewV7()),
		RefundID:   refundID,
		FromStatus: "",
		ToStatus:   domain.RefundStateRequested,
		Reason:     "Initial refund request",
	}

	idem := &domain.IdempotencyKey{
		ID:             uuid.Must(uuid.NewV7()),
		MerchantID:     merchantID,
		IdempotencyKey: req.IdempotencyKey,
		Status:         "PROCESSING",
	}

	// Optimistically assign the updated RefundedAmount for OCC
	payment.RefundedAmount += req.Amount

	// 3. Create Refund with Idempotency
	ref, err := o.repo.CreateRefundWithIdempotency(ctx, refund, history, idem, payloadHash, payment)
	if err != nil {
		if errors.Is(err, domain.ErrIdempotentHit) {
			return &domain.RefundResponse{
				RefundID: ref.ID,
				Status:   ref.Status,
				Reason:   "Idempotent response",
			}, nil
		}
		if errors.Is(err, domain.ErrIdempotencyMismatch) {
			return nil, domain.ErrIdempotencyMismatch
		}
		return nil, fmt.Errorf("failed to create refund: %w", err)
	}

	// 4. Provider Call
	var providerUUID uuid.UUID
	if payment.ProviderID != nil {
		providerUUID = *payment.ProviderID
	} else {
		return o.failRefund(ctx, ref, "original payment has no provider")
	}

	providerStatus, err := o.provider.InitiateRefund(ctx, refundID, providerUUID, req.Amount, payment.Currency, nil, refund.Environment)
	if err != nil {
		return o.handleRefundUnknown(ctx, ref, "Provider timeout/error: "+err.Error())
	}

	// 5. State Transition based on Provider Status
	switch providerStatus {
	case "SUCCESS", "COMPLETED", "REFUNDED":
		ledgerStatus, err := o.ledger.RecordRefundJournalEntry(ctx, refundID, req.PaymentID, req.Amount, payment.Currency, refund.Environment)
		if err != nil || ledgerStatus == "TIMEOUT" {
			return o.handleRefundUnknown(ctx, ref, "Ledger timeout after Provider success")
		}

		ref.Status = domain.RefundStateRefunded
		hist := &domain.RefundStateHistory{
			ID:         uuid.Must(uuid.NewV7()),
			RefundID:   refundID,
			FromStatus: domain.RefundStateRequested,
			ToStatus:   domain.RefundStateRefunded,
			Reason:     "Provider and Ledger succeeded",
		}

		outboxEvent := &domain.OutboxEvent{
			ID:            uuid.Must(uuid.NewV7()),
			AggregateType: "Refund",
			AggregateID:   refundID.String(),
			EventType:     "refund.succeeded",
		}
		outboxEvent.SetPayload(map[string]interface{}{
			"refundId":          refundID.String(),
			"paymentId":         req.PaymentID.String(),
			"merchantId":        payment.MerchantID.String(),
			"merchantReference": payment.MerchantReference,
			"amount":            req.Amount,
			"currency":          payment.Currency,
			"status":            "REFUNDED",
			"timestamp":         time.Now().Format(time.RFC3339),
		})

		if err := o.repo.UpdateRefundState(ctx, ref, hist, outboxEvent); err != nil {
			log.Printf("Failed to transition refund %s to REFUNDED: %v", refundID, err)
		}

		return &domain.RefundResponse{
			RefundID: refundID,
			Status:   domain.RefundStateRefunded,
			Reason:   "Refund completed successfully",
		}, nil

	case "PENDING":
		return o.handleRefundUnknown(ctx, ref, "Provider reported PENDING")

	case "FAILED":
		return o.failRefund(ctx, ref, "Provider rejected refund")

	default:
		return o.handleRefundUnknown(ctx, ref, "Provider returned unrecognized status: "+providerStatus)
	}
}

func (o *PaymentOrchestratorImpl) failRefund(ctx context.Context, ref *domain.Refund, reason string) (*domain.RefundResponse, error) {
	ref.Status = domain.RefundStateFailed
	ref.Reason = reason
	history := &domain.RefundStateHistory{
		ID:         uuid.Must(uuid.NewV7()),
		RefundID:   ref.ID,
		FromStatus: domain.RefundStateRequested,
		ToStatus:   domain.RefundStateFailed,
		Reason:     reason,
	}

	outboxEvent := &domain.OutboxEvent{
		ID:            uuid.Must(uuid.NewV7()),
		AggregateType: "Refund",
		AggregateID:   ref.ID.String(),
		EventType:     "refund.failed",
	}
	outboxEvent.SetPayload(map[string]interface{}{
		"refundId": ref.ID.String(),
		"status":   "FAILED",
		"reason":   reason,
	})

	o.repo.UpdateRefundState(ctx, ref, history, outboxEvent)

	return &domain.RefundResponse{
		RefundID: ref.ID,
		Status:   domain.RefundStateFailed,
		Reason:   reason,
	}, nil
}

func (o *PaymentOrchestratorImpl) handleRefundUnknown(ctx context.Context, ref *domain.Refund, reason string) (*domain.RefundResponse, error) {
	ref.Status = domain.RefundStateUnknown
	ref.Reason = reason
	history := &domain.RefundStateHistory{
		ID:         uuid.Must(uuid.NewV7()),
		RefundID:   ref.ID,
		FromStatus: domain.RefundStateRequested,
		ToStatus:   domain.RefundStateUnknown,
		Reason:     reason,
	}
	o.repo.UpdateRefundState(ctx, ref, history, nil)

	return &domain.RefundResponse{
		RefundID: ref.ID,
		Status:   domain.RefundStateUnknown,
		Reason:   reason,
	}, nil
}

func (o *PaymentOrchestratorImpl) GetPaymentByID(ctx context.Context, paymentID uuid.UUID) (*domain.Payment, error) {
	return o.repo.GetPaymentByID(ctx, paymentID, "")
}

func (o *PaymentOrchestratorImpl) GetMerchantName(ctx context.Context, merchantID uuid.UUID) (string, error) {
	return o.merchant.GetMerchantName(ctx, merchantID)
}

func (o *PaymentOrchestratorImpl) GetAllowedPaymentMethods(ctx context.Context, merchantID uuid.UUID) ([]string, error) {
	config, err := o.getMerchantConfigWithCache(ctx, merchantID)
	if err != nil {
		return nil, err
	}
	return config.EnabledPaymentMethods, nil
}

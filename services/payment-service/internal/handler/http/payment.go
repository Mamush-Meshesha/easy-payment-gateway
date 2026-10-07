package http

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"payment-gateway/payment-service/internal/domain"
	apierrors "payment-gateway/go-apierrors"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	orchestrator domain.PaymentOrchestrator
}

func NewPaymentHandler(orchestrator domain.PaymentOrchestrator) *PaymentHandler {
	return &PaymentHandler{orchestrator: orchestrator}
}

type CreatePaymentRequest struct {
	MerchantReference string    `json:"merchantReference" binding:"required"`
	Amount            int64     `json:"amount" binding:"required,gt=0"`
	Currency          string    `json:"currency" binding:"required,len=3"`
	CustomerID        string    `json:"customerId"`
	IPAddress         string    `json:"ipAddress"`
	PaymentMethod     string    `json:"paymentMethod" binding:"required"`
	ProviderID        uuid.UUID `json:"providerId" binding:"required"`
}

// HandleCreatePayment accepts a payment creation request authenticated via X-API-Key.
//
// @Summary      Create a payment
// @Description  Initiates a new payment. Requires X-API-Key and Idempotency-Key headers.
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        X-API-Key        header  string                true  "API Key (sk_live_... or sk_test_...)"
// @Param        Idempotency-Key  header  string                true  "Idempotency key for safe retries"
// @Param        body             body    CreatePaymentRequest  true  "Payment details"
// @Success      200  {object}  domain.PaymentResponse
// @Success      202  {object}  domain.PaymentResponse
// @Failure      400  {object}  apierrors.APIError
// @Failure      401  {object}  apierrors.APIError
// @Failure      409  {object}  apierrors.APIError
// @Failure      422  {object}  apierrors.APIError
// @Failure      500  {object}  apierrors.APIError
// @Router       /payments [post]
func (h *PaymentHandler) HandleCreatePayment(c *gin.Context) {
	idemKey := c.GetHeader("Idempotency-Key")
	if idemKey == "" {
		apierrors.BadRequest(c, apierrors.ErrCodeMissingIdempotencyKey, "Idempotency-Key header is required")
		return
	}

	apiKey := c.GetHeader("X-API-Key")
	if apiKey == "" {
		apierrors.Unauthorized(c, apierrors.ErrCodeMissingAPIKey, "X-API-Key header is required")
		return
	}

	// Read and hash raw payload for idempotency
	rawData, err := c.GetRawData()
	if err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidPayload, "Failed to read request body")
		return
	}

	hash := sha256.Sum256(rawData)
	payloadHash := hex.EncodeToString(hash[:])

	var req CreatePaymentRequest
	if err := json.Unmarshal(rawData, &req); err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidJSON, "Request body must be valid JSON")
		return
	}

	// Ensure struct bindings (like gt=0) are validated since we manually unmarshaled
	if err := binding.Validator.ValidateStruct(&req); err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeValidationFailed, err.Error())
		return
	}

	paymentReq := &domain.PaymentRequest{
		IdempotencyKey:    idemKey,
		APIKey:            apiKey,
		MerchantReference: req.MerchantReference,
		Amount:            req.Amount,
		Currency:          req.Currency,
		CustomerID:        req.CustomerID,
		IPAddress:         req.IPAddress,
		PaymentMethod:     req.PaymentMethod,
		ProviderID:        req.ProviderID,
	}

	res, err := h.orchestrator.ProcessPayment(c.Request.Context(), paymentReq, payloadHash)
	if err != nil {
		if errors.Is(err, domain.ErrIdempotencyMismatch) {
			apierrors.Conflict(c, apierrors.ErrCodeIdempotencyMismatch, "The Idempotency-Key was already used with a different payload. Use a new key for a new request.")
			return
		}
		if err.Error() == "invalid api key" {
			apierrors.Unauthorized(c, apierrors.ErrCodeInvalidAPIKey, "The provided API key is invalid or has been revoked")
			return
		}
		if errors.Is(err, domain.ErrRiskBlocked) {
			apierrors.UnprocessableEntity(c, apierrors.ErrCodeRiskRejected, "Payment blocked by risk evaluation")
			return
		}
		if errors.Is(err, domain.ErrProviderFailed) {
			apierrors.BadGateway(c, apierrors.ErrCodeProviderUnavailable, "The payment provider rejected the request")
			return
		}
		log.Printf("[ERROR] ProcessPayment internal error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	// Map internal state to HTTP status codes
	switch res.Status {
	case domain.StateSucceeded:
		c.JSON(http.StatusOK, res)
	case domain.StateFailed:
		c.JSON(http.StatusUnprocessableEntity, res)
	case domain.StateCreated, domain.StateInitiated, domain.StateProcessing, domain.StatePending, domain.StateUnknown, domain.StateCompletionPending, domain.StateRequiresAction:
		c.JSON(http.StatusAccepted, res)
	default:
		c.JSON(http.StatusOK, res)
	}
}

type RefundPaymentRequest struct {
	Amount int64  `json:"amount" binding:"required,gt=0"`
	Reason string `json:"reason"`
}

// HandleRefundPayment refunds a previously successful payment.
//
// @Summary      Refund a payment
// @Description  Initiates a refund against a SUCCEEDED payment. Partial refunds are supported.
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        X-API-Key        header  string               true  "API Key"
// @Param        Idempotency-Key  header  string               true  "Idempotency key"
// @Param        id               path    string               true  "Payment ID"
// @Param        body             body    RefundPaymentRequest true  "Refund details"
// @Success      200  {object}  domain.RefundResponse
// @Success      202  {object}  domain.RefundResponse
// @Failure      400  {object}  apierrors.APIError
// @Failure      401  {object}  apierrors.APIError
// @Failure      409  {object}  apierrors.APIError
// @Failure      422  {object}  apierrors.APIError
// @Failure      500  {object}  apierrors.APIError
// @Router       /payments/{id}/refund [post]
func (h *PaymentHandler) HandleRefundPayment(c *gin.Context) {
	idemKey := c.GetHeader("Idempotency-Key")
	if idemKey == "" {
		apierrors.BadRequest(c, apierrors.ErrCodeMissingIdempotencyKey, "Idempotency-Key header is required")
		return
	}

	paymentIDStr := c.Param("id")
	paymentID, err := uuid.Parse(paymentIDStr)
	if err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidPaymentID, "Payment ID must be a valid UUID")
		return
	}

	apiKey := c.GetHeader("X-API-Key")
	if apiKey == "" {
		apierrors.Unauthorized(c, apierrors.ErrCodeMissingAPIKey, "X-API-Key header is required")
		return
	}

	rawData, err := c.GetRawData()
	if err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidPayload, "Failed to read request body")
		return
	}

	hash := sha256.Sum256(rawData)
	payloadHash := hex.EncodeToString(hash[:])

	var req RefundPaymentRequest
	if err := json.Unmarshal(rawData, &req); err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidJSON, "Request body must be valid JSON")
		return
	}
	if err := binding.Validator.ValidateStruct(&req); err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeValidationFailed, err.Error())
		return
	}

	refundReq := &domain.RefundRequest{
		IdempotencyKey: idemKey,
		PaymentID:      paymentID,
		Amount:         req.Amount,
		Reason:         req.Reason,
		APIKey:         apiKey,
	}

	res, err := h.orchestrator.ProcessRefund(c.Request.Context(), refundReq, payloadHash)
	if err != nil {
		if errors.Is(err, domain.ErrIdempotencyMismatch) {
			apierrors.Conflict(c, apierrors.ErrCodeIdempotencyMismatch, "The Idempotency-Key was already used with a different payload. Use a new key for a new request.")
			return
		}
		if err.Error() == "invalid api key" {
			apierrors.Unauthorized(c, apierrors.ErrCodeInvalidAPIKey, "The provided API key is invalid or has been revoked")
			return
		}
		if errors.Is(err, domain.ErrPaymentNotFound) {
			apierrors.NotFound(c, apierrors.ErrCodePaymentNotFound, "No payment found with the provided ID")
			return
		}
		if errors.Is(err, domain.ErrOptimisticLockFailed) {
			apierrors.UnprocessableEntity(c, apierrors.ErrCodeRefundExceedsAmount, "Refund amount exceeds the remaining refundable amount for this payment")
			return
		}
		if errors.Is(err, domain.ErrInvalidState) {
			apierrors.UnprocessableEntity(c, apierrors.ErrCodePaymentNotRefundable, "Payment is not in a refundable state")
			return
		}
		log.Printf("[ERROR] ProcessRefund internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}

	switch res.Status {
	case domain.RefundStateRefunded:
		c.JSON(http.StatusOK, res)
	case domain.RefundStateFailed:
		c.JSON(http.StatusUnprocessableEntity, res)
	default:
		c.JSON(http.StatusAccepted, res)
	}
}

// HandleGetPublicPayment returns public-safe payment details for the checkout page.
//
// @Summary      Get payment for checkout
// @Description  Returns public-safe payment details. Used by the hosted checkout page.
// @Tags         Checkout
// @Produce      json
// @Param        id  path  string  true  "Payment ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  apierrors.APIError
// @Failure      404  {object}  apierrors.APIError
// @Router       /checkout/payments/{id} [get]
func (h *PaymentHandler) HandleGetPublicPayment(c *gin.Context) {
	paymentIDStr := c.Param("id")
	paymentID, err := uuid.Parse(paymentIDStr)
	if err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidPaymentID, "Payment ID must be a valid UUID")
		return
	}

	payment, err := h.orchestrator.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		apierrors.NotFound(c, apierrors.ErrCodePaymentNotFound, "No payment found with the provided ID")
		return
	}

	merchantName, err := h.orchestrator.GetMerchantName(c.Request.Context(), payment.MerchantID)
	if err != nil || merchantName == "" {
		merchantName = "Secure Merchant" // Fallback only if merchant service is completely unavailable
	}

	allowedMethods, err := h.orchestrator.GetAllowedPaymentMethods(c.Request.Context(), payment.MerchantID)
	if err != nil || len(allowedMethods) == 0 {
		// Fallback to legacy behavior if config is missing
		allowedMethods = []string{"CARD"} 
	}

	// Return only public-safe fields for the checkout page
	c.JSON(http.StatusOK, gin.H{
		"id":                    payment.ID.String(),
		"amount":                payment.Amount,
		"currency":              payment.Currency,
		"status":                string(payment.Status),
		"merchantName":          merchantName,
		"paymentMethod":         payment.PaymentMethod,
		"allowedPaymentMethods": allowedMethods,
	})
}

// HandleProcessPublicPayment is used by the frontend checkout page to finalize payment.
//
// @Summary      Process checkout payment
// @Description  Finalizes a payment from the hosted checkout page.
// @Tags         Checkout
// @Produce      json
// @Param        id  path  string  true  "Payment ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  apierrors.APIError
// @Failure      404  {object}  apierrors.APIError
// @Failure      500  {object}  apierrors.APIError
// @Router       /checkout/payments/{id}/process [post]
func (h *PaymentHandler) HandleProcessPublicPayment(c *gin.Context) {
	paymentIDStr := c.Param("id")
	paymentID, err := uuid.Parse(paymentIDStr)
	if err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidPaymentID, "Payment ID must be a valid UUID")
		return
	}

	payment, err := h.orchestrator.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		apierrors.NotFound(c, apierrors.ErrCodePaymentNotFound, "No payment found with the provided ID")
		return
	}

	// In a real app, this endpoint would submit card details or phone number
	// to the provider-service. Since provider-service is mocked to return PENDING,
	// we simulate the async provider webhook callback here for the MVP.
	if payment.Status == domain.StatePending || payment.Status == domain.StateUnknown || payment.Status == domain.StateRequiresAction {
		// Simulate successful callback from provider
		provID := "mock-prov-id"
		if payment.ProviderID != nil {
			provID = payment.ProviderID.String()
		}

		err = h.orchestrator.ResolvePaymentStatus(c.Request.Context(), payment.ID, "SUCCESS", provID, "txn-mock-12345")
		if err != nil {
			log.Printf("[ERROR] ResolvePaymentStatus failed: %v", err)
			apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "SUCCEEDED",
		"message": "Payment processed successfully",
	})
}

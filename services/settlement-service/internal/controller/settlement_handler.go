package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"payment-gateway/settlement-service/internal/service"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SettlementHandler exposes HTTP endpoints for triggering settlements.
// In production, these are called by the internal cron job or a secured admin caller.
type SettlementHandler struct {
	svc service.SettlementService
}

func NewSettlementHandler(svc service.SettlementService) *SettlementHandler {
	return &SettlementHandler{svc: svc}
}

type TriggerSettlementRequest struct {
	MerchantID     string `json:"merchantId" binding:"required"`
	Currency       string `json:"currency" binding:"required,len=3"`
	Amount         int64  `json:"amount" binding:"required,gt=0"`
	IdempotencyKey string `json:"idempotencyKey" binding:"required"`
}

// HandleTriggerSettlement is the internal-only endpoint for creating and processing a settlement.
// POST /internal/settlements/trigger
// This must only be called from within the cluster (no external exposure via nginx).
func (h *SettlementHandler) HandleTriggerSettlement(c *gin.Context) {
	var req TriggerSettlementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
		return
	}

	merchantID, err := uuid.Parse(req.MerchantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid merchantId format"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	payout, err := h.svc.CreateSettlement(ctx, merchantID, req.Currency, req.Amount, req.IdempotencyKey)
	if err != nil {
		log.Printf("[SettlementHandler] CreateSettlement failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create settlement: %v", err)})
		return
	}

	// Immediately attempt to process the payout
	if err := h.svc.ProcessSettlement(ctx, payout.ID); err != nil {
		log.Printf("[SettlementHandler] ProcessSettlement failed for payout %s: %v", payout.ID, err)
		// Return the payout record even if processing fails — it's durably stored.
		c.JSON(http.StatusAccepted, gin.H{
			"payout":  payout,
			"warning": fmt.Sprintf("settlement created but processing encountered an error: %v", err),
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"payout": payout})
}

// HandleGetSettlement retrieves a payout by ID.
// GET /internal/settlements/:id
func (h *SettlementHandler) HandleGetSettlement(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payout ID"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Note: GetPayoutByID returns (nil, nil) if not found per the repo implementation.
	// We need a way to get this from the service. For now, we expose it via the handler
	// directly — in a full implementation this would go through a service method.
	_ = ctx
	_ = id
	c.JSON(http.StatusNotImplemented, gin.H{"error": "GET settlement not yet implemented"})
}

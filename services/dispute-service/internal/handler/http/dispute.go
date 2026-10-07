package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"payment-gateway/dispute-service/internal/domain"
	"payment-gateway/dispute-service/internal/service"
)

type DisputeHandler struct {
	orchestrator *service.DisputeOrchestrator
	repo         domain.DisputeRepository
}

func NewDisputeHandler(orchestrator *service.DisputeOrchestrator, repo domain.DisputeRepository) *DisputeHandler {
	return &DisputeHandler{
		orchestrator: orchestrator,
		repo:         repo,
	}
}

func (h *DisputeHandler) ListDisputes(c *gin.Context) {
	merchantIDStr := c.GetHeader("X-Merchant-Id")
	if merchantIDStr == "undefined" {
		merchantIDStr = ""
	}
	merchantID, _ := uuid.Parse(merchantIDStr)

	disputes, err := h.repo.ListDisputes(merchantID, 100, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list disputes"})
		return
	}

	c.JSON(http.StatusOK, disputes)
}

func (h *DisputeHandler) SimulateDispute(c *gin.Context) {
	merchantIDStr := c.GetHeader("X-Merchant-Id")
	if merchantIDStr == "undefined" {
		merchantIDStr = ""
	}
	merchantID, _ := uuid.Parse(merchantIDStr)

	// Generate a random payment ID to dispute for testing
	paymentID := uuid.Must(uuid.NewV7())
	
	dispute, err := h.orchestrator.HandleIncomingDispute(
		merchantID, 
		paymentID, 
		8900, // 89.00
		"ETB", 
		domain.DisputeReasonFraud,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dispute)
}

func (h *DisputeHandler) GetDispute(c *gin.Context) {
	disputeIDStr := c.Param("id")
	disputeID, err := uuid.Parse(disputeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dispute id"})
		return
	}

	dispute, err := h.repo.GetDispute(disputeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "dispute not found"})
		return
	}

	// Fetch evidence as well
	evidence, _ := h.repo.ListEvidence(dispute.ID)

	c.JSON(http.StatusOK, gin.H{
		"dispute":  dispute,
		"evidence": evidence,
	})
}

type AddEvidenceRequest struct {
	FileName string `json:"fileName" binding:"required"`
	S3Key    string `json:"s3Key" binding:"required"`
	MimeType string `json:"mimeType" binding:"required"`
}

func (h *DisputeHandler) AddEvidence(c *gin.Context) {
	disputeIDStr := c.Param("id")
	disputeID, err := uuid.Parse(disputeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dispute id"})
		return
	}

	var req AddEvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ev, err := h.orchestrator.SubmitEvidence(disputeID, req.FileName, req.S3Key, req.MimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ev)
}

func (h *DisputeHandler) AcceptDispute(c *gin.Context) {
	disputeIDStr := c.Param("id")
	disputeID, err := uuid.Parse(disputeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dispute id"})
		return
	}

	if err := h.orchestrator.AcceptDispute(disputeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ACCEPTED"})
}

// System endpoints (internal/webhooks)

type TriggerDisputeRequest struct {
	MerchantID uuid.UUID `json:"merchantId" binding:"required"`
	PaymentID  uuid.UUID `json:"paymentId" binding:"required"`
	Amount     int64     `json:"amount" binding:"required"`
	Currency   string    `json:"currency" binding:"required"`
	Reason     string    `json:"reason" binding:"required"`
}

func (h *DisputeHandler) SystemTriggerDispute(c *gin.Context) {
	var req TriggerDisputeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dispute, err := h.orchestrator.HandleIncomingDispute(req.MerchantID, req.PaymentID, req.Amount, req.Currency, domain.DisputeReason(req.Reason))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dispute)
}

func (h *DisputeHandler) SystemResolveDispute(c *gin.Context) {
	disputeIDStr := c.Param("id")
	disputeID, err := uuid.Parse(disputeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dispute id"})
		return
	}

	var req struct {
		Won bool `json:"won"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.orchestrator.ResolveDispute(disputeID, req.Won); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "dispute resolved"})
}

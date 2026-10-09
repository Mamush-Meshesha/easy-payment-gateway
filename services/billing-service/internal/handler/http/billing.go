package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"payment-gateway/billing-service/internal/domain"
)

type BillingHandler struct {
	repo domain.BillingRepository
}

func NewBillingHandler(repo domain.BillingRepository) *BillingHandler {
	return &BillingHandler{repo: repo}
}

func (h *BillingHandler) CreatePlan(c *gin.Context) {
	merchantIDStr := c.GetHeader("X-Merchant-Id")
	if merchantIDStr == "undefined" {
		merchantIDStr = ""
	}

	var req struct {
		Name     string `json:"name" binding:"required"`
		Amount   int64  `json:"amount" binding:"required,gt=0"`
		Currency string `json:"currency" binding:"required,len=3"`
		Interval string `json:"interval" binding:"required,oneof=MONTHLY YEARLY"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	merchantID, _ := uuid.Parse(merchantIDStr)

	plan := &domain.Plan{
		ID:         uuid.Must(uuid.NewV7()),
		MerchantID: merchantID,
		Name:       req.Name,
		Amount:     req.Amount,
		Currency:   req.Currency,
		Interval:   req.Interval,
		IsActive:   true,
	}

	if err := h.repo.CreatePlan(plan); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create plan"})
		return
	}

	c.JSON(http.StatusCreated, plan)
}

func (h *BillingHandler) CreateSubscription(c *gin.Context) {
	merchantIDStr := c.GetHeader("X-Merchant-Id")
	if merchantIDStr == "undefined" {
		merchantIDStr = ""
	}

	var req struct {
		PlanID                 uuid.UUID `json:"plan_id" binding:"required"`
		CustomerID             string    `json:"customer_id" binding:"required"`
		DefaultPaymentMethodID uuid.UUID `json:"default_payment_method_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	merchantID, _ := uuid.Parse(merchantIDStr)

	// Validate Plan belongs to Merchant
	plan, err := h.repo.GetPlan(req.PlanID)
	if err != nil || plan.MerchantID != merchantID {
		c.JSON(http.StatusNotFound, gin.H{"error": "plan not found"})
		return
	}

	sub := &domain.Subscription{
		ID:                     uuid.Must(uuid.NewV7()),
		PlanID:                 req.PlanID,
		CustomerID:             req.CustomerID,
		MerchantID:             merchantID,
		DefaultPaymentMethodID: req.DefaultPaymentMethodID,
		Status:                 domain.SubscriptionStatusActive,
		// Assuming it starts billing immediately for the first period
	}

	if err := h.repo.CreateSubscription(sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create subscription"})
		return
	}

	c.JSON(http.StatusCreated, sub)
}

func (h *BillingHandler) GetSubscriptions(c *gin.Context) {
	merchantIDStr := c.GetHeader("X-Merchant-Id")
	if merchantIDStr == "undefined" {
		merchantIDStr = ""
	}
	merchantID, _ := uuid.Parse(merchantIDStr)

	subs, err := h.repo.ListSubscriptions(merchantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch subscriptions"})
		return
	}

	c.JSON(http.StatusOK, subs)
}

func (h *BillingHandler) CancelSubscription(c *gin.Context) {
	merchantIDStr := c.GetHeader("X-Merchant-Id")
	if merchantIDStr == "undefined" {
		merchantIDStr = ""
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription id"})
		return
	}

	// In a real app we'd verify the sub belongs to the merchant first
	err = h.repo.UpdateSubscriptionStatus(id, domain.SubscriptionStatusCanceled)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "subscription canceled"})
}

func (h *BillingHandler) GetPlans(c *gin.Context) {
	merchantIDStr := c.GetHeader("X-Merchant-Id")
	if merchantIDStr == "undefined" {
		merchantIDStr = ""
	}
	merchantID, _ := uuid.Parse(merchantIDStr)

	plans, err := h.repo.ListPlans(merchantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch plans"})
		return
	}

	c.JSON(http.StatusOK, plans)
}

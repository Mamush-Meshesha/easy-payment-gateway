package http

import (
	"log"
	"net/http"
	"payment-gateway/risk-service/internal/domain"
	apierrors "payment-gateway/go-apierrors"

	"github.com/gin-gonic/gin"
)

type RiskHandler struct {
	service domain.RiskService
}

func NewRiskHandler(service domain.RiskService) *RiskHandler {
	return &RiskHandler{service: service}
}

func (h *RiskHandler) GetActiveRules(c *gin.Context) {
	rules, err := h.service.GetActiveRules(c.Request.Context())
	if err != nil {
		log.Printf("[ERROR] GetActiveRules internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}
	c.JSON(http.StatusOK, rules)
}

func (h *RiskHandler) CreateRule(c *gin.Context) {
	var rule domain.RiskRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateRule(c.Request.Context(), &rule); err != nil {
		log.Printf("[ERROR] CreateRule internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}

	c.JSON(http.StatusCreated, rule)
}

func (h *RiskHandler) GetAnalytics(c *gin.Context) {
	stats, err := h.service.GetAnalytics(c.Request.Context())
	if err != nil {
		log.Printf("[ERROR] GetAnalytics internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}
	c.JSON(http.StatusOK, stats)
}

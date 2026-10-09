package http

import (
	"log"
	"net/http"
	apierrors "payment-gateway/go-apierrors"
	"payment-gateway/provider-service/internal/domain"

	"github.com/gin-gonic/gin"
)

type ProviderHandler struct {
	service domain.ProviderService
}

func NewProviderHandler(service domain.ProviderService) *ProviderHandler {
	return &ProviderHandler{service: service}
}

type createProviderRequest struct {
	Code         string                      `json:"code" binding:"required"`
	Name         string                      `json:"name" binding:"required"`
	Capabilities []domain.ProviderCapability `json:"capabilities"`
}

func (h *ProviderHandler) CreateProvider(c *gin.Context) {
	var req createProviderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierrors.BadRequest(c, apierrors.ErrCodeInvalidJSON, "Request body must be valid JSON")
		return
	}

	provider, err := h.service.CreateProvider(c.Request.Context(), req.Code, req.Name, req.Capabilities)
	if err != nil {
		if err == domain.ErrProviderAlreadyExists || err == domain.ErrInvalidInput {
			apierrors.BadRequest(c, apierrors.ErrCodeValidationFailed, err.Error())
			return
		}
		log.Printf("[ERROR] CreateProvider internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}

	c.JSON(http.StatusCreated, provider)
}

func (h *ProviderHandler) GetProvider(c *gin.Context) {
	id := c.Param("id")
	provider, err := h.service.GetProvider(c.Request.Context(), id)
	if err != nil {
		if err == domain.ErrProviderNotFound {
			apierrors.NotFound(c, apierrors.ErrCodeProviderNotFound, "Provider not found")
			return
		}
		log.Printf("[ERROR] GetProvider internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}

	c.JSON(http.StatusOK, provider)
}

func (h *ProviderHandler) ListProviders(c *gin.Context) {
	providers, err := h.service.ListProviders(c.Request.Context())
	if err != nil {
		log.Printf("[ERROR] ListProviders internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}

	c.JSON(http.StatusOK, providers)
}

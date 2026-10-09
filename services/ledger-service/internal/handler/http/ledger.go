package http

import (
	"errors"
	"log"
	"net/http"
	"payment-gateway/ledger-service/internal/domain"
	apierrors "payment-gateway/go-apierrors"

	"github.com/gin-gonic/gin"
)

type LedgerHandler struct {
	service domain.LedgerService
}

func NewLedgerHandler(service domain.LedgerService) *LedgerHandler {
	return &LedgerHandler{service: service}
}

func (h *LedgerHandler) GetAccountBalance(c *gin.Context) {
	id := c.Param("id")
	account, err := h.service.GetAccountBalance(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrAccountNotFound) {
			apierrors.NotFound(c, apierrors.ErrCodeResourceNotFound, "Account not found")
			return
		}
		log.Printf("[ERROR] GetAccountBalance internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *LedgerHandler) GetJournalEntry(c *gin.Context) {
	refType := c.Query("referenceType")
	refID := c.Query("referenceId")

	if refType == "" || refID == "" {
		apierrors.BadRequest(c, apierrors.ErrCodeValidationFailed, "referenceType and referenceId query params are required")
		return
	}

	entry, err := h.service.GetJournalEntry(c.Request.Context(), refType, refID)
	if err != nil {
		log.Printf("[ERROR] GetJournalEntry internal error: %v", err)
		apierrors.InternalError(c, c.GetHeader("X-Trace-Id"))
		return
	}
	if entry == nil {
		apierrors.NotFound(c, apierrors.ErrCodeResourceNotFound, "Journal entry not found")
		return
	}

	c.JSON(http.StatusOK, entry)
}

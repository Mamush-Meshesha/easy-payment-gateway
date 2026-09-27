package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ResolveRequest struct {
	ResolvedBy string `json:"resolved_by" binding:"required"`
	Reason     string `json:"reason" binding:"required"`
	Reference  string `json:"reference"`
}

func (h *ReconciliationHandler) HandleResolveException(c *gin.Context) {
	exceptionID := c.Param("id")
	if exceptionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "exception id is required"})
		return
	}

	var req ResolveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload: " + err.Error()})
		return
	}

	if err := h.service.ResolveException(c.Request.Context(), exceptionID, req.ResolvedBy, req.Reason, req.Reference); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve exception: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "exception resolved successfully"})
}

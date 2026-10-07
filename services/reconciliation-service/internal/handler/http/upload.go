package http

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"payment-gateway/reconciliation-service/internal/domain"

	"github.com/gin-gonic/gin"
)

type ReconciliationHandler struct {
	service domain.ReconciliationService
}

func NewReconciliationHandler(service domain.ReconciliationService) *ReconciliationHandler {
	return &ReconciliationHandler{service: service}
}

func (h *ReconciliationHandler) RegisterRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1/reconciliation")
	{
		v1.POST("/upload", h.HandleUploadStatement)
		v1.POST("/exceptions/:id/resolve", h.HandleResolveException)
		v1.GET("/jobs", h.HandleGetJobs)
		v1.GET("/jobs/:id/exceptions", h.HandleGetExceptions)
	}
}

func (h *ReconciliationHandler) HandleUploadStatement(c *gin.Context) {
	providerID := c.PostForm("provider_id")
	if providerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider_id is required"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	// Calculate SHA256 of the file for deduplication
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash file"})
		return
	}
	fileHash := hex.EncodeToString(hash.Sum(nil))

	// Reset file pointer to beginning for parser
	if seeker, ok := file.(io.Seeker); ok {
		seeker.Seek(0, io.SeekStart)
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "file stream does not support seeking"})
		return
	}

	jobID, err := h.service.ProcessStatement(c.Request.Context(), providerID, header.Filename, fileHash, file)
	if err != nil {
		if err == domain.ErrDuplicateStatement {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Statement uploaded successfully and reconciliation job started",
		"job_id":  jobID,
	})
}

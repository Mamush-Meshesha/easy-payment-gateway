package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *ReconciliationHandler) HandleGetJobs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	jobs, err := h.service.GetJobs(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch jobs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": jobs})
}

func (h *ReconciliationHandler) HandleGetExceptions(c *gin.Context) {
	jobID := c.Param("id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "job id is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	exceptions, err := h.service.GetExceptions(c.Request.Context(), jobID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch exceptions: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": exceptions})
}

package router

import (
	"payment-gateway/risk-service/internal/handler/http"

	"github.com/gin-gonic/gin"
)

func SetupRouter(riskHandler *http.RiskHandler) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api/v1/risk")
	{
		api.GET("/rules", riskHandler.GetActiveRules)
		api.POST("/rules", riskHandler.CreateRule)
		api.GET("/analytics", riskHandler.GetAnalytics)
	}

	return r
}

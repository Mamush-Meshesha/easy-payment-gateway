package router

import (
	"payment-gateway/provider-service/internal/handler/http"

	"github.com/gin-gonic/gin"
)

func SetupRouter(providerHandler *http.ProviderHandler) *gin.Engine {
	r := gin.Default()

	v1 := r.Group("/api/v1")
	{
		providers := v1.Group("/providers")
		{
			providers.POST("", providerHandler.CreateProvider)
			providers.GET("", providerHandler.ListProviders)
			providers.GET("/:id", providerHandler.GetProvider)
		}
	}

	return r
}

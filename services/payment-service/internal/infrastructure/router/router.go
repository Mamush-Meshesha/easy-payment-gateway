package router

import (
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	handlerhttp "payment-gateway/payment-service/internal/handler/http"

	"github.com/gin-gonic/gin"
)

func SetupRouter(paymentHandler *handlerhttp.PaymentHandler) *gin.Engine {
	r := gin.Default()

	// ── Health ──────────────────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "payment-service"})
	})

	// ── Metrics (Prometheus scrape endpoint is wired in main.go via observability) ──

	// ── API Docs ────────────────────────────────────────────────────────────
	// Serves the raw OpenAPI spec and a simple Swagger UI redirect.
	// The spec file is resolved relative to the monorepo root.
	r.GET("/api-docs/openapi.yaml", func(c *gin.Context) {
		specPath := resolveSpecPath()
		if _, err := os.Stat(specPath); os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI spec not found"})
			return
		}
		c.Header("Content-Type", "application/yaml")
		c.File(specPath)
	})

	// Redirects to Swagger UI (petstore-style) with our spec pre-loaded.
	// In production, replace this with a self-hosted Swagger UI deployment.
	r.GET("/api-docs", func(c *gin.Context) {
		specURL := c.Request.Host + "/api-docs/openapi.yaml"
		swaggerUIURL := "https://petstore.swagger.io/?url=http://" + specURL
		c.Redirect(http.StatusTemporaryRedirect, swaggerUIURL)
	})

	// ── Payment API v1 ──────────────────────────────────────────────────────
	api := r.Group("/api/v1")
	{
		api.POST("/payments", paymentHandler.HandleCreatePayment)
		api.POST("/payments/:id/refund", paymentHandler.HandleRefundPayment)

		checkout := api.Group("/checkout")
		{
			checkout.GET("/payments/:id", paymentHandler.HandleGetPublicPayment)
			checkout.POST("/payments/:id/process", paymentHandler.HandleProcessPublicPayment)
		}
	}

	return r
}

// resolveSpecPath finds the openapi.yaml file relative to the monorepo root.
// Works regardless of the working directory the binary is invoked from.
func resolveSpecPath() string {
	// Try environment variable override first (useful in Docker)
	if envPath := os.Getenv("OPENAPI_SPEC_PATH"); envPath != "" {
		return envPath
	}

	// Walk up from this source file to find docs/openapi.yaml
	_, filename, _, _ := runtime.Caller(0)
	// filename = .../services/payment-service/internal/infrastructure/router/router.go
	// We need 5 levels up to reach the monorepo root
	base := filepath.Dir(filename)
	for i := 0; i < 5; i++ {
		base = filepath.Dir(base)
	}
	return filepath.Join(base, "docs", "openapi.yaml")
}

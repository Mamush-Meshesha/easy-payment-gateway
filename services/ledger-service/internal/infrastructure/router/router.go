package router

import (
	"payment-gateway/ledger-service/internal/handler/http"

	"github.com/gin-gonic/gin"
)

func SetupRouter(ledgerHandler *http.LedgerHandler) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api/v1")
	{
		api.GET("/accounts/:id/balance", ledgerHandler.GetAccountBalance)
		api.GET("/entries", ledgerHandler.GetJournalEntry) // query params: referenceType, referenceId
	}

	return r
}

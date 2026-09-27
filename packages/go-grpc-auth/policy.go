
package grpcauth

var s2sPolicy = map[string][]string{
	// Merchant Service
	"/merchant.MerchantService/ValidateApiKey":           {"payment-service"},
	"/merchant.MerchantService/GetWebhookConfig":         {"webhook-service"},
	"/merchant.MerchantService/GetPayoutDestination":     {"settlement-service"},
	// Risk Service
	"/risk.RiskService/CheckRisk":                        {"payment-service"},
	// Provider Service
	"/provider.ProviderService/InitiatePayment":          {"payment-service"},
	"/provider.ProviderService/InitiateRefund":           {"payment-service"},
	// Ledger Service — Financial write operations (strictly scoped)
	"/ledger.LedgerService/RecordJournalEntry":           {"payment-service"},
	"/ledger.LedgerService/ReserveFunds":                 {"settlement-service"},
	"/ledger.LedgerService/ReleaseReservedFunds":         {"settlement-service"},
	"/ledger.LedgerService/CompleteSettlement":           {"settlement-service"},
	"/ledger.LedgerService/GetLedgerEntriesByReferences": {"reconciliation-service"},
	// Ledger Service — BFF Read APIs (business auth enforced inside handler)
	"/ledger.LedgerService/GetLedgerBalances":            {"dashboard-service", "reporting-service", "settlement-service"},
	"/ledger.LedgerService/GetLedgerEntriesPaginated":    {"dashboard-service", "reporting-service"},
	// Payment Read Service — BFF Read APIs
	"/payment_read.PaymentReadService/GetPayment":           {"dashboard-service", "reporting-service"},
	"/payment_read.PaymentReadService/GetPayments":          {"dashboard-service", "reporting-service"},
	"/payment_read.PaymentReadService/GetRefunds":           {"dashboard-service", "reporting-service"},
	"/payment_read.PaymentReadService/GetTransactions":      {"dashboard-service", "reporting-service"},
	// Settlement Read Service — BFF Read APIs
	"/settlement_read.SettlementReadService/GetSettlements": {"dashboard-service", "reporting-service"},
}

// GlobalPolicy is the centralized Zero-Trust authorization matrix for the payment gateway.
func GlobalPolicy(identity *Identity, fullMethod string) bool {
	allowedCallers, exists := s2sPolicy[fullMethod]
	if !exists {
		return false // Default Deny
	}
	for _, caller := range allowedCallers {
		if identity.ServiceName == caller {
			return true
		}
	}
	return false // Default Deny
}

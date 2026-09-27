# gRPC RPC Coverage & Classification

## Inventory

### Auth Service (`auth.proto`)
- `ProvisionMerchantOwner`: IMPLEMENTED_UNTESTED

### Merchant Service (`merchant.proto`)
- `GetMerchantStatus`: IMPLEMENTED_UNTESTED
- `ValidateApiKey`: IMPLEMENTED_UNTESTED
- `GetWebhookConfig`: IMPLEMENTED_UNTESTED
- `GetPayoutDestination`: OPTIONAL_NOT_IMPLEMENTED

### Provider Service (`provider.proto`)
- `GetProviderStatus`: IMPLEMENTED_UNTESTED
- `InitiatePayment`: PARTIALLY_TESTED (Needs FAILED/TIMEOUT coverage)

### Risk Service (`risk.proto`)
- `CheckRisk`: PARTIALLY_TESTED

### Ledger Service (`ledger.proto`)
- `RecordJournalEntry`: PARTIALLY_TESTED (Needs balance invariant coverage)
- `GetLedgerEntriesByReferences`: IMPLEMENTED_UNTESTED
- `ReserveFunds`: OPTIONAL_NOT_IMPLEMENTED
- `ReleaseReservedFunds`: OPTIONAL_NOT_IMPLEMENTED
- `CompleteSettlement`: OPTIONAL_NOT_IMPLEMENTED
- `GetLedgerBalances`: IMPLEMENTED_UNTESTED
- `GetLedgerEntriesPaginated`: OPTIONAL_NOT_IMPLEMENTED

### Payment & Transaction Read Services
- `GetPayments`: OPTIONAL_NOT_IMPLEMENTED
- `GetPayment`: OPTIONAL_NOT_IMPLEMENTED
- `GetPaymentStatusHistory`: OPTIONAL_NOT_IMPLEMENTED
- `GetTransactions`: OPTIONAL_NOT_IMPLEMENTED
- `GetTransaction`: OPTIONAL_NOT_IMPLEMENTED

## Analysis
All `OPTIONAL_NOT_IMPLEMENTED` read RPCs and settlement RPCs are deferred. We will focus purely on testing the existing gRPC core logic (Phase E, F, K).

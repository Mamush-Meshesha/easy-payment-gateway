# Service-to-Service (S2S) Authorization Policy

**Policy Version**: v1
**Policy Owner**: Security / Platform
**Effective Environment**: production
**Default Decision**: DENY

This document defines the strict, zero-trust explicit authorization matrix for all internal gRPC and Kafka communications. 
This policy separates **S2S authorization** (who can call an operation) from **Business authorization** (can they perform this specific mutation), which must be handled at the application layer.

All services are identified by their verified SPIFFE URI extracted from the mTLS client certificate SAN:
Format: `spiffe://payment-gateway/ns/<environment>/sa/<service-name>` (e.g. `spiffe://payment-gateway/ns/production/sa/payment-service`)

## 1. gRPC Security Pipeline
Every gRPC server MUST enforce the following interceptor chain in order:
1. **TLS/mTLS Authentication Interceptor**: Validates client certificate chain against trusted CA, checking validity/usage.
2. **SPIFFE Identity Extraction**: Extracts exactly one authorized SPIFFE URI from the verified SAN. (Rejects on failure -> `UNAUTHENTICATED`)
3. **S2S Authorization Interceptor**: Checks caller identity against the matrix below. (Rejects on failure -> `PERMISSION_DENIED`)
4. **Request Correlation/Trace Interceptor**
5. **Audit/Security Logging Interceptor**

## 2. gRPC Authorization Matrix (ALLOW)

| Caller Identity (`client`) | Target Service (`server`) | RPC Method | Permission |
| :--- | :--- | :--- | :--- |
| `payment-service` | `merchant-service` | `/merchant.MerchantService/ValidateApiKey` | `ALLOW` |
| `payment-service` | `risk-service` | `/risk.RiskService/EvaluateRisk` | `ALLOW` |
| `payment-service` | `provider-service` | `/provider.ProviderService/InitiatePayment` | `ALLOW` |
| `payment-service` | `ledger-service` | `/ledger.LedgerService/RecordJournalEntry` | `ALLOW` |
| `webhook-service` | `merchant-service` | `/merchant.MerchantService/GetWebhookConfig` | `ALLOW` |
| `settlement-service` | `merchant-service` | `/merchant.MerchantService/GetPayoutDestination` | `ALLOW` |
| `settlement-service` | `ledger-service` | `/ledger.LedgerService/ReserveFunds` | `ALLOW` |
| `settlement-service` | `ledger-service` | `/ledger.LedgerService/ReleaseReservedFunds` | `ALLOW` |
| `settlement-service` | `ledger-service` | `/ledger.LedgerService/CompleteSettlement` | `ALLOW` |
| `reconciliation-service`| `ledger-service` | `/ledger.LedgerService/GetLedgerEntriesByReferences` | `ALLOW` |

## 3. Explicit DENY Boundaries (Financial Mutations)
While Default-Deny applies universally, the following sensitive boundaries are explicitly documented for security reviews:

| Caller Identity (`client`) | Target Service (`server`) | RPC Method | Permission |
| :--- | :--- | :--- | :--- |
| `payment-service` | `ledger-service` | `CompleteSettlement`, `ReserveFunds`, `ReleaseReservedFunds` | `DENY` |
| `reconciliation-service` | `ledger-service` | `RecordJournalEntry`, `CompleteSettlement` | `DENY` |
| `webhook-service` | `ledger-service` | `*` (Any mutation) | `DENY` |
| `reporting-service` | `ledger-service` | `*` (Any mutation) | `DENY` |
| `admin-service` | `ledger-service` | `*` (Any direct financial mutation) | `DENY` |

## 4. Kafka ACL Matrix
Kafka security follows the exact same zero-trust model. Application services are strictly denied from performing cluster actions (`CREATE`, `DELETE`, `ALTER` topics).

| Service Identity | Topic | Consumer Group | Operation | Permission |
| :--- | :--- | :--- | :--- | :--- |
| `payment-service` | `payment.events` | `N/A` (Producer) | `WRITE` | `ALLOW` |
| `payment-service` | `transaction.events` | `payment-service` | `READ` | `ALLOW` |
| `transaction-service` | `transaction.events` | `N/A` (Producer) | `WRITE` | `ALLOW` |
| `transaction-service` | `provider.webhook.events`| `transaction-service` | `READ` | `ALLOW` |
| `merchant-service` | `merchant.events` | `N/A` (Producer) | `WRITE` | `ALLOW` |
| `auth-service` | `merchant.events` | `auth-service` | `READ` | `ALLOW` |
| `webhook-service` | `payment.events` | `webhook-service` | `READ` | `ALLOW` |
| `webhook-service` | `transaction.events` | `webhook-service` | `READ` | `ALLOW` |

> **Event Transformation Trust Boundary**: Note that `payment-service` consumes `transaction.events` and produces `payment.events`. This is an explicit, authorized transformation boundary where external provider-level success is converted into merchant-facing payment logic.

### Explicit Kafka Denials for Application Services
- `DENY CREATE` (Topics)
- `DENY DELETE` (Topics)
- `DENY ALTER` (Topics/Configs)
- `DENY CLUSTER_ACTION`
- `DENY` Consumer Group impersonation

# System Test Inventory

This document maps out the backend architecture to serve as the foundation for the Phase 1-28 system-wide integration and E2E validation.

## 1. Auth Service
* **Type**: Node.js (Express)
* **HTTP Port**: 3001
* **gRPC Port**: 50051 (Server)
* **Database**: `payment_gateway` (schema: `auth`)
* **Redis**: Yes (Refresh tokens, rate limits)
* **Kafka Topics Produced**: None
* **Kafka Topics Consumed**: `merchant.events`
* **gRPC Clients**: None
* **gRPC Servers**: `AuthService`
* **REST Endpoints**:
  * `POST /api/v1/auth/login`
  * `POST /api/v1/auth/register-admin`
  * `POST /api/v1/auth/refresh`
* **Auth Requirement**: Public (login/refresh), `SUPER_ADMIN` (admin actions)
* **Tenant Requirement**: No
* **Key Entities**: User, Role, RefreshToken

## 2. Merchant Service
* **Type**: Node.js (Express)
* **HTTP Port**: 3002
* **gRPC Port**: 50052 (Server)
* **Database**: `payment_gateway` (schema: `merchant`)
* **Redis**: No
* **Kafka Topics Produced**: `merchant.events`
* **Kafka Topics Consumed**: None
* **gRPC Clients**: None
* **gRPC Servers**: `MerchantService`
* **REST Endpoints**:
  * `POST /api/v1/merchants`
  * `GET /api/v1/merchants/:id`
  * `POST /api/v1/merchants/:id/apikeys`
* **Auth Requirement**: Valid JWT, `SUPER_ADMIN` or `MERCHANT_ADMIN`
* **Tenant Requirement**: Merchant Isolation (Merchant A cannot access Merchant B apikeys)
* **Key Entities**: Merchant, ApiKey, WebhookConfig

## 3. Admin Service
* **Type**: Node.js (Express)
* **HTTP Port**: 3003
* **gRPC Port**: N/A
* **Database**: Read models (BFF)
* **Redis**: No
* **REST Endpoints**:
  * `GET /api/v1/admin/merchants`
  * `GET /api/v1/admin/system/health`
* **Auth Requirement**: Valid JWT, `SUPER_ADMIN`
* **Tenant Requirement**: Global

## 4. Dashboard Service
* **Type**: Node.js (Express)
* **HTTP Port**: 3004 (or dynamic)
* **gRPC Port**: N/A
* **REST Endpoints**:
  * `GET /api/v1/dashboard/payments`
  * `GET /api/v1/dashboard/transactions`
  * `GET /api/v1/dashboard/balances`
* **Auth Requirement**: Valid JWT, `MERCHANT_ADMIN`
* **Tenant Requirement**: Strictly Tenant Isolated
* **gRPC Clients**: Payment, Ledger, Transaction

## 5. Payment Service
* **Type**: Go (Gin + gRPC)
* **HTTP Port**: 8084
* **gRPC Port**: (Client only)
* **Database**: `payment_gateway` (schema: `payment`)
* **Redis**: No
* **Kafka Topics Produced**: `payment.events`
* **Kafka Topics Consumed**: `transaction.status.updated`
* **gRPC Clients**: `MerchantService`, `RiskService`, `ProviderService`, `LedgerService`
* **REST Endpoints**:
  * `POST /api/v1/payments`
* **Auth Requirement**: Valid `X-API-Key`
* **Tenant Requirement**: Implicit via API Key
* **Key Entities**: Payment, OutboxEvent
* **State Machine**: `PENDING -> PROCESSING -> SUCCEEDED | FAILED | UNKNOWN`

## 6. Ledger Service
* **Type**: Go
* **HTTP Port**: 8085
* **gRPC Port**: 50053 (Server)
* **Database**: `payment_gateway` (schema: `ledger`)
* **REST Endpoints**: `GET /api/v1/accounts/:id/balance`
* **Auth Requirement**: mTLS + Context
* **Key Entities**: Account, JournalEntry, JournalLine

## 7. Risk Service
* **Type**: Go
* **HTTP Port**: 8086
* **gRPC Port**: 50054 (Server)
* **Database**: `payment_gateway` (schema: `risk`)
* **Redis**: Yes (Velocity checks)
* **Key Entities**: RiskRule, RiskDecision

## 8. Provider Service
* **Type**: Go
* **HTTP Port**: 8087
* **gRPC Port**: 50055 (Server)
* **Database**: `payment_gateway` (schema: `provider`)
* **REST Endpoints**:
  * `POST /api/v1/providers`
  * `GET /api/v1/providers`
  * `GET /api/v1/providers/:id`
* **Key Entities**: Provider, ProviderConfig

## 9. Transaction Service (Worker)
* **Type**: Go (Kafka Consumer)
* **Kafka Topics Consumed**: `provider.normalized.event`
* **Kafka Topics Produced**: `transaction.status.updated`
* **Key Entities**: Transaction

## 10. Webhook Service (Worker)
* **Type**: Go (Kafka Consumer)
* **Kafka Topics Consumed**: `payment.events`, `transaction.events`
* **State Machine**: `PENDING -> DELIVERING -> DELIVERED | RETRY_WAIT | DEAD_LETTERED`

## 11. Settlement Service (Worker)
* **Type**: Go
* **Key Entities**: Settlement
* **State Machine**: `CREATED -> RESERVING -> FUNDS_RESERVED -> SUBMITTING -> PROCESSING | COMPLETED | FAILED | UNKNOWN | RELEASED`

## 12. Reconciliation Service (Worker)
* **Type**: Go
* **HTTP Port**: (Configured via Uploader)
* **REST Endpoints**: `POST /api/v1/reconciliation/upload`
* **Key Entities**: ReconciliationJob, ReconciliationException

## 13. Reporting Service
* **Type**: Node.js
* **REST Endpoints**:
  * `GET /api/v1/reports/payments`
  * `GET /api/v1/reports/payments/export.csv`
* **Kafka Topics Consumed**: `payment.events`

## 14. Notification Service
* **Type**: Node.js
* **Kafka Topics Consumed**: `payment.events`

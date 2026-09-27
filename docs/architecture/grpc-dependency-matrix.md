# gRPC Dependency Matrix

This document audits every synchronous gRPC dependency across the payment-gateway architecture, classifying them based on necessity, cacheability, and authority.

## Classification Legend
- **A. AUTHORITATIVE**: Must remain strictly synchronous. Single source of financial/security truth.
- **B. CACHEABLE READ-MOSTLY**: May use Redis. Safely cacheable with versioned invalidation.
- **C. ASYNCHRONOUS**: Should use Kafka/event flow.
- **D. UNNECESSARY**: Remove if redundant.

---

## 1. Payment Service Dependencies

### `MerchantService` -> `ValidateApiKey`
- **Classification**: **A. AUTHORITATIVE** (Security)
- **Description**: Validates API key and returns `merchant_id` and `environment`.
- **Constraint**: Cannot be cached. Must always verify if API key is revoked or merchant suspended.

### `MerchantService` -> `GetMerchantConfig` *(New)*
- **Classification**: **B. CACHEABLE READ-MOSTLY**
- **Description**: Fetches `fee_routing`, `enabled_payment_methods`, and configuration `version`.
- **Consistency Model**: Redis Cache -> Read-Through Fallback -> Kafka Cache Invalidation (Versioned).
- **Failure Behavior**: If Redis fails, call this endpoint. If both fail, fail the dependency.

### `RiskService` -> `EvaluateRisk`
- **Classification**: **A. AUTHORITATIVE** (Security/Financial)
- **Description**: Velocity checks and dynamic merchant limits.
- **Constraint**: Must remain synchronous to prevent limit circumvention.

### `ProviderService` -> `ProcessPayment`
- **Classification**: **A. AUTHORITATIVE** (Financial)
- **Description**: Core gateway financial operation.
- **Constraint**: Inherently synchronous for realtime provider responses.

### `LedgerService` -> `RecordTransaction`
- **Classification**: **A. AUTHORITATIVE** (Financial)
- **Description**: Core accounting ledger updates.
- **Constraint**: Must be synchronously immutable.

---

## 2. Settlement Service Dependencies

### `MerchantService` -> `GetPayoutDestination`
- **Classification**: **A. AUTHORITATIVE** (Security/Financial)
- **Description**: Fetches bank details for merchant payout.
- **Constraint**: Cannot be cached. Payout destinations are security-critical and must be read authoritatively at execution time.

### `LedgerService` -> `GetBalances`
- **Classification**: **A. AUTHORITATIVE** (Financial)
- **Description**: Fetches net positions for settlement calculations.
- **Constraint**: Must be authoritative.

---

## 3. Reconciliation Service Dependencies

### `LedgerService` -> `GetTransactions`
- **Classification**: **A. AUTHORITATIVE** (Financial)
- **Description**: Fetches historical ledger entries to match with provider reports.

---

## 4. Auth Service Dependencies

### `MerchantService` -> `GetMerchant`
- **Classification**: **A. AUTHORITATIVE** (Security)
- **Description**: Maps user to merchant identity.
- **Constraint**: Part of core RBAC. Must remain authoritative.

---

## Changes & Removed Dependencies

### Removed from `ValidateApiKey` (Payment Service)
- **Previous Behavior**: `ValidateApiKey` returned API key validity AND merchant configuration (`fee_routing`, `enabled_payment_methods`) in a single synchronous call.
- **New Behavior**: Configuration data is stripped from `ValidateApiKey`. A new cacheable flow (`GetMerchantConfig` + Redis) manages configuration.
- **Consistency Model**: Strong consistency for identity/auth (ValidateApiKey). Eventual consistency for configuration (Redis + Kafka).
- **Failure Behavior**: If Redis is down, system falls back to `GetMerchantConfig`. If `MerchantService` is completely down, auth fails (secure fallback), but configuration reads succeed if cached.
- **Security Implications**: Caching configuration introduces no security risk because the API key and merchant status are STILL validated synchronously via `ValidateApiKey`. Old cached configurations will simply reject unsupported methods at the payment service layer until updated, but no unauthorized requests will ever bypass security.

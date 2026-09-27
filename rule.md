# PAYMENT GATEWAY — MASTER PROJECT RULES

## 0. PURPOSE OF THIS DOCUMENT

This document is the **authoritative engineering rulebook** for the Ethiopian payment gateway project.

Any AI coding agent, including Antigravity, must read this file before:

* creating a service
* modifying an existing service
* creating database tables
* changing payment states
* implementing a provider integration
* implementing webhooks
* implementing refunds
* changing Kafka events
* changing gRPC contracts
* changing authentication
* changing ledger behavior
* changing reconciliation
* changing settlement logic
* changing infrastructure
* optimizing payment processing
* fixing production bugs
* adding new providers

The system is intended to evolve toward a **production-grade payment infrastructure platform** connecting merchants to supported Ethiopian payment providers and financial infrastructure.

This is a financial system.

Therefore:

> Correctness, consistency, traceability, idempotency and recoverability are more important than implementation speed.

Do not optimize for "it works in the happy path."

The system must be designed around:
* failures
* retries
* duplicated requests
* duplicated events
* network failures
* provider failures
* service crashes
* database failures
* Kafka failures
* race conditions
* delayed callbacks
* unknown transaction outcomes
* reconciliation
* operational recovery
* security
* auditability

---

# 1. PROJECT OBJECTIVE

Build a payment gateway platform that allows merchants to initiate payments through supported Ethiopian payment providers.

Initial provider architecture:
1. Telebirr
2. Safaricom Ethiopia / M-PESA
3. EthSwitch / supported financial institutions
4. Mock provider for local development and automated testing

The architecture must allow additional providers to be added without rewriting the payment core.

The gateway must provide:
* merchant management
* API authentication
* payment creation
* payment status
* refunds
* transaction history
* provider routing
* provider adapters
* webhook processing
* idempotency
* ledger/accounting foundation
* reconciliation
* settlement tracking
* risk controls
* audit logs
* notifications
* monitoring
* metrics
* tracing
* alerting
* administrative controls
* merchant dashboard
* operational recovery tools

---

# 2. CRITICAL PRINCIPLE

The gateway is NOT simply:

```text
API
    ↓
Telebirr API
    ↓
Success
```

A production payment system is:

```text
Merchant
   ↓
API Gateway
   ↓
Payment Service
   ↓
Transaction State Machine
   ↓
Provider Orchestrator
   ↓
Provider Adapter
   ↓
External Provider
   ↓
Webhook / Query / Reconciliation
   ↓
Payment State
   ↓
Ledger
   ↓
Events
   ↓
Settlement / Reporting / Notification
```

Every step can fail. The system must remain recoverable when any individual component fails.

---

# 3. TECHNOLOGY STACK

## 3.1 Go

Use Go for high-throughput and financially sensitive core services.

Primary Go services:
* payment-service
* transaction-service
* provider-service
* webhook-service
* ledger-service
* reconciliation-service
* settlement-service
* risk-service

Go is preferred where:
* concurrency matters
* high throughput matters
* payment state transitions are involved
* provider communication is involved
* low latency matters
* financial transaction processing occurs

Use:
* context.Context
* structured logging
* explicit error handling
* database transactions
* interfaces
* dependency injection
* gRPC
* protobuf
* OpenTelemetry
* Prometheus
* race detector
* table-driven tests

---

# 4. TYPESCRIPT / EXPRESS

Use Express + TypeScript for management/business/API-oriented services.

Possible services:
* auth-service
* merchant-service
* admin-service
* dashboard-service
* notification-service
* reporting-service

These services may handle:
* users
* authentication
* merchant onboarding
* dashboard APIs
* administrative operations
* reporting
* notifications
* configuration

Do NOT put core financial state transitions inside random Express controllers. Business logic must live in service/domain layers.

For financial operations:

```text
API
 ↓
Go payment service
 ↓
domain logic
 ↓
transaction
 ↓
provider
```

---

# 5. MICROSERVICE PRINCIPLES

Each service must have a clear responsibility.
Services must not randomly share database tables.

If another service needs information, use:
* gRPC
* Kafka events
* an API

Do not bypass service ownership through direct database access.

---

# 6. PROPOSED SERVICES

## 6.1 API Gateway
Responsibilities: TLS termination, routing, rate limiting, request size limits, authentication forwarding, CORS, correlation IDs, basic protection. Technology: Nginx initially.

## 6.2 Auth Service
Responsibilities: dashboard authentication, user registration, login, logout/session management, password management, role-based access, token/session handling, account security.
Never store: payment PIN, Telebirr PIN, M-PESA PIN, OTP secrets belonging to providers.

## 6.3 Merchant Service
Owns: merchant accounts, merchant configuration, provider configuration references, API keys, merchant status, webhook configuration, merchant limits.
A suspended merchant must not initiate new financial operations.

---

# 7. PAYMENT SERVICE

The Payment Service is the central payment orchestration service.
Responsibilities: validate payment request, authenticate merchant, validate amount, create payment, enforce idempotency, select provider, initiate provider operation, maintain payment state, expose payment status, coordinate refunds, emit domain events.

It must NOT assume that provider API response = final payment truth.

---

# 8. TRANSACTION SERVICE

Maintain:
* internal_payment_id
* internal_transaction_id
* provider_transaction_id
* merchant_reference
* idempotency_key

Never rely on one ID for everything.

---

# 9. PAYMENT STATE MACHINE

Payments must use explicit states:
`CREATED, INITIATED, PENDING, PROCESSING, UNKNOWN, SUCCEEDED, FAILED, CANCELLED, EXPIRED`

---

# 10. STATE TRANSITION RULE

Never allow arbitrary state changes (e.g., SUCCEEDED → PENDING or SUCCEEDED → FAILED).
A late webhook must not overwrite a terminal successful payment.

Terminal states: `SUCCEEDED, FAILED, CANCELLED, EXPIRED`.

---

# 11. UNKNOWN IS NOT FAILED

If a network timeout occurs, Gateway sees `timeout`. The gateway does NOT know whether the payment succeeded.
Therefore: `TIMEOUT != FAILED`. Use `UNKNOWN` or an equivalent recoverable state.
Then resolve through provider query, webhook, or reconciliation. Never blindly retry the financial operation.

---

# 12. MONEY RULES

Never use floating point for money (`float64`).
Use integer minor units (e.g., `100.50 ETB` represented as `10050`).
Every transaction must include `amount` and `currency`.
Never trust amount from a webhook without verifying it against the internal record.

---

# 13. CURRENCY

The payment engine must validate provider capabilities (supported currencies, limits, refunds) before initiating a payment.

---

# 14. IDEMPOTENCY

Every payment creation request must support an idempotency key scoped to `merchant_id + idempotency_key`.
Two identical requests with the same key must not create two financial transactions.

---

# 15. IDEMPOTENCY EDGE CASES

- Two requests arrive simultaneously with the same key: Only one payment may be created using DB unique constraints or locks.
- Same key with different request body: Reject the second request.

---

# 16. PROVIDER ABSTRACTION

Every provider must implement a common interface. The core payment domain must not contain provider-specific logic (no `if provider == "telebirr"` in the core engine).

---

# 17. PROVIDER ADAPTERS

Each adapter (Mock, Telebirr, MPesa, EthSwitch) owns authentication, request mapping, response mapping, error mapping, webhook verification, and retries.

---

# 18. DO NOT INVENT PROVIDER APIS

CRITICAL. Never invent endpoints, credentials, signatures, or webhook formats. Use MockProvider until official docs and access are provided.

---

# 19. TELEBIRR & 20. M-PESA & 21. ETHSWITCH

Use official documentation and sandboxes. Never automate a consumer app or store consumer PINs/passwords. Treat EthSwitch as interoperability infrastructure.

---

# 22. WEBHOOK SERVICE

Webhooks are first-class financial events. Must include: receive, verify, parse, validate, identify TX, deduplicate, persist, transition state, emit event, acknowledge.

---

# 23. WEBHOOK IDEMPOTENCY & 24. WEBHOOK BEFORE API RESPONSE

A provider may send multiple webhooks; apply the effect only once. A webhook may arrive before the HTTP response finishes; handle this safely.

---

# 25. WEBHOOK REPLAY ATTACK & 26. OUT-OF-ORDER WEBHOOKS

Protect with signatures and event IDs. State transitions must be monotonic (e.g., PENDING must not downgrade an already committed SUCCESS).

---

# 27. PROVIDER TIMEOUT & 28. GATEWAY CRASH & 29. DB FAILURE

Do not blindly retry on timeouts. If a crash happens after provider success, rely on webhooks, queries, and reconciliation to recover. 

---

# 30. KAFKA

Kafka is for asynchronous communication (`payment.succeeded`, `refund.requested`, etc). Event names must be versionable.

---

# 31. KAFKA MUST NOT BE THE ONLY SOURCE OF TRUTH

The authoritative financial state belongs in persistent DB storage. Kafka is just the event mechanism.

---

# 32. TRANSACTIONAL OUTBOX

Commit the DB update and insert the outbox event in the same DB transaction. Then publish to Kafka.

---

# 33. KAFKA FAILURE & 34. KAFKA DUPLICATE EVENTS

If Kafka dies, DB transaction still persists the outbox event. Consumers must be strictly idempotent to handle duplicate deliveries safely.

---

# 35. CONSUMER REBALANCE & 36. DEAD LETTER QUEUE (DLQ)

Never create duplicate financial effects during consumer restarts. Poison messages must go to a DLQ and not block the partition.

---

# 37. GRPC & 38. GRPC RETRIES

Use gRPC for internal sync comms. Never blindly retry financial operations; only retry idempotent or read-only operations.

---

# 39. REDIS

Use for caching, rate limits, locks. NOT authoritative for financial data. Payments must be recoverable if Redis is wiped.

---

# 40. DATABASE & 41. DB CONCURRENCY

PostgreSQL is primary. Use row locking, unique constraints, and optimistic locking to prevent concurrent update races (e.g., simultaneous webhooks or refunds).

---

# 42. LEDGER & 43. LEDGER IMMUTABILITY

Double-entry accounting. TOTAL DEBITS = TOTAL CREDITS. The ledger is append-only. Never UPDATE an old ledger record to fix history; create a correcting entry.

---

# 44. REFUNDS & 45. REFUND CONCURRENCY

Cannot refund a failed payment. Cannot refund more than captured. Use transactional locking to prevent concurrent refunds from exceeding the capture amount.

---

# 46. PAYMENT EXPIRATION

Late provider success on an expired payment must not be silently discarded. Define a business rule (reversal, review, reconciliation).

---

# 47. RECONCILIATION & 48. RECONCILIATION CASES

Mandatory. Compare internal system vs provider records. Detect amount mismatches, status mismatches, missing internal TXs, and missing provider TXs.

---

# 49. SETTLEMENT

Track gross, fees, refunds, adjustments, net amount, and settlement status.

---

# 50. MERCHANT API & 51. PAYMENT REQUEST & 52. API RESPONSE

Version APIs. Keep requests generic (no provider-specific fields leaked to merchants). Never expose secrets or raw stack traces.

---

# 53. API AUTH & 54. DASHBOARD AUTH & 55. RBAC

Use API keys for merchants (hashed, rotated). Use secure sessions for dashboards. Enforce RBAC (SUPER_ADMIN, MERCHANT_OWNER) server-side.

---

# 56. AUDIT LOG & 57. SECURITY

Record all sensitive administrative actions (append-only). Enforce TLS, secret management, rate limits, SQLi/XSS protection, and signature verification.

---

# 58. NEVER STORE PAYMENT PINs & 59. LOGGING RULES

Never store/log PINs, OTPs, or API secrets. Use structured JSON logging with trace_id, request_id, payment_id.

---

# 60. TRACEABILITY & 61. OBSERVABILITY

Payments must be traceable from request to settlement. Use Prometheus, Grafana, OpenTelemetry. Track latencies, error rates, consumer lag, and DB pool usage.

---

# 62. PROVIDER HEALTH & 63. RATE LIMITING

Track health. Do NOT automatically fail over a charge to another provider without explicit idempotency safety. Apply rate limits to all APIs.

---

# 64. RISK ENGINE & 65. DUPLICATE DETECTION

Implement limits and velocity checks. Treat duplicate requests as risk signals, not automatic proof of fraud.

---

# 66. NOTIFICATIONS & 67. NOTIFICATION DUPLICATES

Notifications are async. Payment success must not depend on email/SMS delivery. Idempotency is required.

---

# 68. FRONTEND & 69. ERROR HANDLING

Frontend is never authoritative. Classify errors securely (VALIDATION_ERROR, PROVIDER_TIMEOUT) without exposing internal infrastructure details.

---

# 70. RETRY RULES & 71. TIMEOUT RULES

Every network call must have a timeout. Never use default HTTP clients without deadlines. Only retry safe operations.

---

# 72. CIRCUIT BREAKER & 73. DATABASE MIGRATIONS

Circuit breaking must not falsely classify payments as failed. Every schema change must use migrations (versioned, reversible, tested).

---

# 74. BACKWARD COMPATIBILITY & 75. EVENT SCHEMA & 76. CLOCK

Add fields, don't remove. Version event schemas. Use UTC internally.

---

# 77. UUIDS & 78. EDGE CASE MASTER LIST

Use globally unique internal IDs (separate for payment, transaction, webhook). Refer to the master list of edge cases in testing (duplicates, timeouts, 500s, crashes, races).

---

# 79. WHAT NOT TO DO

1. Never use floating-point money.
2. Never blindly retry payment creation.
3. Never treat timeout as failure automatically.
4. Never trust frontend payment status.
5. Never trust a webhook without verification.
6. Never process the same webhook twice.
7. Never update ledger history. Create correction entries.
8. Never store PINs or OTPs.
9. Never log secrets.
10. Never fabricate provider APIs.
11. Never directly manipulate another service's database.
12. Never make Kafka the financial source of truth.
13. Never make Redis the financial source of truth.
14. Never automatically fail over a financial charge to another provider without a safe idempotency strategy.
15. Never let a stale webhook downgrade a successful payment.
16. Never assume external provider API behavior.
17. Never remove idempotency because it complicates development.
18. Never skip reconciliation.
19. Never hide unknown transactions.
20. Never silently discard failed events.

---

# 80. TESTING STRATEGY to 94. PERFORMANCE PRINCIPLE

Test heavily at unit, integration, and E2E levels. Focus on failure, concurrency, and chaos testing. Never connect local dev to production. Use mock providers. Prioritize CORRECTNESS over microsecond optimization. Data retention and backups are critical.

---

# 95. CODE ORGANIZATION to 99. DOCUMENTATION

Go: `cmd/`, `internal/` (domain, application, repository).
TS: `src/` (controllers, services, repositories).
Every service must document its purpose, API, events, and failure modes. Keep domain logic out of HTTP controllers.

---

# 100. ANTIGRAVITY DEVELOPMENT RULE

Work incrementally. Do not attempt to build the entire platform in one operation.
1. Inspect repo
2. Understand architecture
3. Identify affected services/DB/APIs
4. Implement smallest correct change
5. Write tests
6. Run lint/build/tests
7. Review for race conditions/security
8. Document change
9. Stop and report

---

# 101. BEFORE IMPLEMENTING A FEATURE

Antigravity must answer internally:
- Who owns this data? Is money involved? Can it be duplicated?
- What happens on timeout, crash, DB failure, Kafka failure, duplicate webhook, race condition?
If these cannot be answered, the feature is not production-ready.

---

# 102. FINANCIAL CHECKLIST & 103. PAYMENT COMPLETION & 104. REFUND COMPLETION

Always verify merchant status, amounts, idempotency, provider results, and state transitions before marking any financial operation as complete.

---

# 105. INCIDENT RESPONSE & 106. UNKNOWN TX HANDLING

Never manually modify DB records during incidents. Investigate logs, webhooks, and provider status. Every UNKNOWN transaction must have a defined recovery path.

---

# 107. FINANCIAL INVARIANTS

1. One idempotency key = one charge.
2. Webhooks cannot duplicate effects.
3. Ledger debits = credits.
4. Refunded <= Refundable.
5. SUCCESS cannot be downgraded.
6. Money is exact.
7. Unknown TXs are recovered.
8. History is auditable.
9. Provider failures do not duplicate charges.
10. Services do not touch other DBs.

---

# 108. PRODUCTION READINESS CHECKLIST

Ensure architecture, security, payments, data, messaging, observability, and provider integrations are thoroughly tested and documented before going live.

---

# 109. PROJECT DEVELOPMENT ORDER

1. Foundation -> 2. Infrastructure -> 3. Auth/Merchant -> 4. Payment Core -> 5. Mock Provider -> 6. gRPC -> 7. Kafka -> 8. Webhooks -> 9. Ledger -> 10. Refunds -> 11. Reconciliation -> 12. Settlement -> 13. Telebirr -> 14. M-PESA -> 15. EthSwitch -> 16. Dashboard -> 17. Observability -> 18. Security -> 19. Chaos Testing -> 20. Production.

---

# 110. ANTIGRAVITY FINAL RULE

Do not optimize for producing code quickly. The objective is CORRECTNESS -> CONSISTENCY -> SECURITY -> RECOVERABILITY -> OBSERVABILITY -> PERFORMANCE. Stop and inspect existing contracts when uncertain.

---

# 111. FINAL NON-NEGOTIABLE RULES

1. Never double-charge a customer.
2. Never lose a payment because of a timeout.
3. Never treat UNKNOWN as FAILED without evidence.
4. Never process a webhook twice.
5. Never blindly retry a financial operation.
6. Never trust frontend financial state.
7. Never store customer payment PINs or OTPs.
8. Never log secrets.
9. Never invent provider APIs.
10. Never directly manipulate another service's database.
11. Never make Kafka the financial source of truth.
12. Never make Redis the financial source of truth.
13. Never automatically fail over a financial charge to another provider without a safe idempotency strategy.
14. Never let a stale webhook downgrade a successful payment.
15. Never assume external provider API behavior.
16. Never remove idempotency because it complicates development.
17. Never skip reconciliation.
18. Never hide unknown transactions.
19. Never silently discard failed events.

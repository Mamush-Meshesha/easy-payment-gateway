# Microservice Boundaries & Responsibilities

The system is designed with a strict bounded context for each domain. There are currently 14 microservices.

## 1. Core Financial Services (Go)

Go was chosen for the financial core due to its concurrency model, memory safety, and high-throughput capabilities.

- **`payment-service` (The Orchestrator)**: The central brain of the system. Validates API keys, enforces idempotency, evaluates risk, calls the provider, and publishes state transition events. Exposes REST endpoints to the internet.
- **`provider-service`**: Handles the physical integration with external payment gateways (Telebirr, CBE Birr, etc.). Abstracts all external systems behind a standard gRPC interface.
- **`ledger-service`**: Maintains the immutable double-entry accounting journal. Strictly ensures the books balance. All financial movements (fees, principal, settlements) are recorded here.
- **`settlement-service`**: Evaluates merchant balances and triggers payout instructions via providers. Uses a payout state machine to handle delays and failures safely.
- **`reconciliation-service`**: Ingests CSV files from providers and performs deterministic matching against ledger records to find missing or conflicting transactions.
- **`transaction-service`**: Provides a consolidated, high-performance read-model for transactions and payment states, optimized for dashboard queries and reporting.
- **`webhook-service`**: Reliably delivers HTTP callbacks to merchants with HMAC signatures. Includes exponential backoff and dead-letter queues.
- **`risk-service`**: Enforces transaction limits, velocity rules, and fraud prevention logic via synchronous gRPC checks during payment orchestration.

## 2. Management & API Services (Express + TypeScript)

TypeScript/Express was chosen for the CRUD and management layers because it excels at handling complex nested JSON objects and rapid UI-facing API development.

- **`admin-service`**: Handles internal administrative operations such as suspending merchants, overriding limits, and viewing system-wide analytics.
- **`merchant-service`**: Manages merchant onboarding, KYC, configuration (fee routing, allowed payment methods), and API key lifecycle.
- **`auth-service`**: Handles session management, user login, RBAC (Role-Based Access Control), and tenant isolation.
- **`dashboard-service`**: Functions as a Backend-For-Frontend (BFF) for the React merchant dashboard. Aggregates data from multiple Go services via gRPC.
- **`reporting-service`**: Consumes Kafka events to maintain aggregated projections (daily volumes, fee revenues) for charting and CSV exports.
- **`notification-service`**: Sends email and SMS notifications (e.g., password resets, settlement confirmations) triggered by system events.

## Communication Patterns

1. **Synchronous (gRPC)**: Used when an immediate response is required to proceed. E.g., `payment-service` asking `merchant-service` to validate an API key, or asking `risk-service` to evaluate a transaction.
2. **Asynchronous (Kafka)**: Used for state changes and side effects. E.g., `payment-service` publishing a `PaymentSucceeded` event which is consumed independently by the `ledger-service` and `webhook-service`.

# Payment Lifecycle

This document describes the end-to-end lifecycle of a payment transaction as it flows through the payment gateway architecture. 

The payment engine serves as the central orchestrator and utilizes the saga pattern with strict idempotency and event-driven state transitions.

## The State Machine

Payments transition through a strict set of states:
- **CREATED**: The initial request is received and persisted with an idempotency lock.
- **INITIATED**: The merchant API key and risk evaluation have passed.
- **PROCESSING**: The system is actively calling the external provider (e.g., Telebirr).
- **PENDING**: The provider acknowledged the request but it requires asynchronous completion (e.g., user PIN entry).
- **SUCCEEDED**: The payment was successfully captured. The double-entry ledger has been updated.
- **FAILED**: The payment was declined by risk, provider, or user.
- **UNKNOWN**: The provider communication timed out or failed to return a determinable state. **Money is never moved in this state.**

## Step-by-Step Flow

### 1. Ingestion & Authentication
- The request hits the Nginx API Gateway and is routed to the `payment-service` (Go).
- The orchestrator validates the API key via gRPC with the `merchant-service`.
- The merchant configuration (enabled payment methods, fee routing) is fetched (with a local Redis cache to minimize latency).

### 2. Idempotency & Persistence
- A `PaymentRequest` object is created.
- A unique idempotency key lock is acquired via PostgreSQL.
  - If it's a true replay (same key and payload hash), the existing payment response is returned.
  - If the payload differs for the same key, a `409 Conflict` is returned.
- The initial `CREATED` state is written to the database alongside a `PaymentStateHistory` audit record.

### 3. Risk Evaluation
- A synchronous gRPC call is made to the `risk-service`.
- If the risk engine returns a `BLOCK` action, the payment is immediately failed and the state transitions to `FAILED`.
- Note: We use a fail-closed policy. If the `risk-service` is unreachable, the payment is failed.

### 4. Provider Execution
- The state transitions to `PROCESSING`.
- The `provider-service` is invoked via gRPC, executing the specific provider adapter (e.g., Telebirr).
- **Timeout Handling**: If the provider connection times out or the response is ambiguous, the payment transitions to the `UNKNOWN` state. A background recovery job will later reconcile this state.

### 5. Asynchronous Webhooks & Finalization
- When the final status is reached (`SUCCEEDED`, `FAILED`, `PENDING`), the outbox pattern ensures the state change is published to Kafka.
- The `ledger-service` consumes the `SUCCEEDED` events and records the immutable double-entry journal entries.
- The `webhook-service` consumes the event and reliably delivers the HMAC-signed webhook to the merchant.

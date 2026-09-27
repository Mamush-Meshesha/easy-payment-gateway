# Payment Orchestration (Saga Workflow)

The Payment Service is the central orchestrator. It uses a **Workflow Saga** pattern, meaning it coordinates the downstream services synchronously via gRPC, and publishes state changes asynchronously via Kafka.

## Component Choreography

1. **Merchant Service (gRPC)**: Queried synchronously to validate `API Key` and fetch `merchant_id`.
2. **Postgres Idempotency Lock**: Row-level locking on `idempotency_keys`.
3. **Risk Service (gRPC)**: Synchronous evaluation.
4. **Provider Service (gRPC)**: Synchronous intent transmission. The provider service normalizes external API responses into a standard format.
5. **Ledger Service (gRPC)**: Synchronous double-entry accounting.
6. **Kafka (Outbox)**: Publishing `PaymentStatusChanged`.

## The "Happy Path" Workflow

```text
POST /payments
   │
   ├─ 1. Auth: ValidateApiKey(gRPC) → Success
   ├─ 2. Lock: Postgres `idempotency_keys` → Acquired
   ├─ 3. State: Insert Payment (CREATED)
   ├─ 4. Risk: CheckRisk(gRPC) → ALLOW
   ├─ 5. State: Update Payment (INITIATED)
   ├─ 6. Provider: InitiatePayment(gRPC) → SUCCESS
   ├─ 7. State: Update Payment (COMPLETION_PENDING)
   ├─ 8. Ledger: RecordJournalEntry(gRPC) → COMMITTED
   ├─ 9. State: Update Payment (SUCCEEDED)
   └─ 10. Event: Insert Outbox(PaymentSucceeded)
```

## The "Unknown" Path (e.g. Provider Timeout)

```text
POST /payments
   │
   ├─ 1-5. (Same as above)
   ├─ 6. Provider: InitiatePayment(gRPC) → TIMEOUT
   ├─ 7. State: Update Payment (UNKNOWN)
   ├─ 8. Event: Insert Outbox(PaymentUnknown)
   └─ Return 202 Accepted (Processing)
```
*Note: A background reconciliation job or a later webhook will resolve the `UNKNOWN` state to `SUCCEEDED` or `FAILED`.*

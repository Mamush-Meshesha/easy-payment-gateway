# Failure and Recovery Matrix

This matrix defines exactly how the Payment Service behaves under distributed failure conditions.

> [!WARNING]  
> **Timeout != Failure**. We never automatically fail a payment when money movement becomes uncertain.

| Failure Scenario | Current State | Safe Next State | Recovery Mechanism | Can Retry Fin. Op? |
| :--- | :--- | :--- | :--- | :--- |
| **Merchant Service Unavailable** | Pre-auth | Error to caller | Return HTTP 503 | N/A |
| **Risk Service Unavailable** | `CREATED` | `FAILED` (Fail-closed) | Log and fail payment | N/A |
| **Risk Service Timeout** | `CREATED` | `FAILED` (Fail-closed) | Log and fail payment | N/A |
| **Provider Unavailable** | `INITIATED` | `FAILED` | Return decline to user | No |
| **Provider Timeout** | `PROCESSING` | `UNKNOWN` | Reconciliation background job querying provider status | **NO** (Never blindly retry) |
| **Provider Success + Gateway Crash** | `PROCESSING` | `UNKNOWN` | Reconciliation job detects orphan processing | N/A |
| **Provider Success + Ledger Unavailable**| `COMPLETION_PENDING` | `COMPLETION_PENDING` | Asynchronous retry worker targeting Ledger | Yes (Ledger is Idempotent) |
| **Ledger Timeout after commit** | `COMPLETION_PENDING` | `UNKNOWN` (Ledger state) | Re-run Ledger RPC (it is idempotent) | Yes (Idempotent) |
| **Kafka Unavailable** | Varies | Same | Transactional Outbox pattern guarantees eventual publish | N/A |
| **Duplicate Payment Request** | Pre-auth | Return existing | Postgres `idempotency_keys` intercepts | N/A |
| **Transaction Service Unavailable**| Varies | Same | Kafka retains events for eventual delivery | N/A |

## Principles
1. **Never Assume Rollback**: Do not invent rollback behavior for providers that do not guarantee it.
2. **Reconciliation is Recovery**: Reconciliation is a recovery mechanism, not merely a reporting feature.
3. **Idempotency is Mandatory**: We rely on the Ledger's idempotency to safely recover from `COMPLETION_PENDING`.

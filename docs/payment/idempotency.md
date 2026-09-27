# Idempotency Guarantees

The Payment Service must prevent duplicate financial operations. We rely on PostgreSQL constraint enforcement, not just application-level checks.

## The Idempotency Key
Every `POST /payments` request MUST include an `Idempotency-Key` header.
- **Scope**: Idempotency keys are scoped per `merchant_id`.
- **TTL**: Keys are retained in the `idempotency_keys` table for 30 days.

## PostgreSQL Enforcement
We define a strict UNIQUE constraint:
`UNIQUE(merchant_id, idempotency_key)`

### Flow
1. Received request with `Idempotency-Key`.
2. Attempt to `INSERT INTO idempotency_keys (merchant_id, idempotency_key, status) VALUES (...)`.
3. If `UniqueViolation` occurs:
   - Query the existing record.
   - If the request payload hashes to a different value, reject with `409 Conflict`.
   - If the request payload matches, fetch the associated `payment_id`.
   - Return the current state of that payment (200 OK or 202 Accepted).
4. If `INSERT` succeeds, proceed with creating the payment.

## Recovery
If a payment fails deterministically (e.g., Risk Block), the idempotency key remains linked to the `FAILED` payment. The merchant must generate a *new* idempotency key to retry a new transaction.

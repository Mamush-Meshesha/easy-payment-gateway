# Concurrency Strategy

Financial systems experience heavy concurrency: double-clicks, concurrent webhooks, simultaneous refunds, and race conditions. The database is the final arbiter of truth.

## 1. Optimistic Concurrency Control (OCC)
Used for entities where concurrent updates might overwrite each other, but contention is low-to-medium.
- **Implementation**: A `version BIGINT` column on the table.
- **Pattern**:
  ```sql
  UPDATE payments
  SET status = 'SUCCEEDED', version = version + 1
  WHERE id = $1 AND version = $expected_version
  ```
- **Usage**: `payments`, `refunds`, `ledger_balances`.

## 2. Row-level Locking (Pessimistic)
Used when operations absolutely must be serialized to prevent complex business rule violations (e.g., ensuring total refunds don't exceed captured amount).
- **Implementation**: `SELECT ... FOR UPDATE`.
- **Pattern**:
  ```sql
  BEGIN;
  SELECT amount, refunded_amount FROM payments WHERE id = $1 FOR UPDATE;
  -- Calculate new refund
  -- Update payment
  -- Insert refund
  COMMIT;
  ```
- **Usage**: Checking merchant limits, processing refunds, ledger journal posting.
- **Deadlock Avoidance**: Always lock resources in the same lexicographical or hierarchical order (e.g., lock payment before refund).

## 3. Database Constraints (Defensive)
Used as a failsafe against application logic failures.
- **Unique Constraints**: `merchant_id` + `idempotency_key` guarantees only one DB record exists regardless of how many parallel requests bypass the app layer cache.
- **Check Constraints**: `CHECK (amount > 0)`, `CHECK (refund_amount <= original_amount)`.

## 4. Transactional Outbox
Used to guarantee an event is published to Kafka ONLY IF the database transaction commits successfully.
- **Pattern**:
  ```sql
  BEGIN;
  UPDATE payments SET status = 'SUCCEEDED' ...
  INSERT INTO outbox_events (event_type, payload) VALUES ('PAYMENT_SUCCEEDED', ...);
  COMMIT;
  ```

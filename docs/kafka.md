# Event-Driven Architecture (Kafka)

The payment gateway relies heavily on Apache Kafka to decouple services, guarantee eventual consistency, and enable high throughput.

## The Outbox Pattern

To solve the dual-write problem (saving to PostgreSQL and publishing to Kafka reliably), we use the **Transactional Outbox Pattern**.

1. **Transaction Start**: The `payment-service` opens a Postgres transaction.
2. **Business Logic**: It updates the payment status to `SUCCEEDED`.
3. **Outbox Insertion**: It inserts an event record into an `outbox_events` table in the *same* database transaction.
4. **Transaction Commit**: Postgres commits atomically.
5. **Relay Worker**: A background worker continuously polls the `outbox_events` table and publishes the messages to Kafka. Once Kafka acknowledges receipt, the outbox record is marked as `published`.

This guarantees at-least-once delivery of events without requiring distributed transactions.

## Core Topics & Consumers

### `payment.events`
- **Producer**: `payment-service`
- **Consumers**: 
  - `ledger-service` (Posts journal entries for successful captures)
  - `webhook-service` (Dispatches HTTP callbacks to merchants)
  - `transaction-service` (Updates read-models)
  - `reporting-service` (Aggregates daily volume metrics)

### `merchant.config.events`
- **Producer**: `merchant-service` (When a merchant changes their fee routing or payment methods)
- **Consumers**: `payment-service` (Updates its local fast-cache of merchant configurations to avoid constant gRPC calls).

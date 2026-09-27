# Transaction Lifecycle

The boundary between the **Payment Service** and the **Transaction Service**.

## Payment Service (Internal Truth)
- Owns the Merchant's intent to pay.
- Owns internal states (`CREATED`, `INITIATED`, `PROCESSING`, `SUCCEEDED`).
- Mutates its own DB exclusively.

## Transaction Service (External Truth)
- Owns the lifecycle of the *Provider's* representation of the transaction.
- Tracks `provider_transaction_id` mapping to our internal `payment_id`.
- Consumes external webhooks (via Kafka from Webhook Service) and normalizes them into internal standard events.
- Never mutates the `payment_db` directly.

## Communication Pattern
```text
Provider Webhook 
      ↓
[Webhook Service] -> Signature verification, deduplication
      ↓
(Kafka: provider.raw.events)
      ↓
[Transaction Service] -> Parses, updates transaction_db
      ↓
(Kafka: transaction.status.updated)
      ↓
[Payment Service] -> Evaluates state transition, updates payment_db
```

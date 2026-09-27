# Kafka Event Coverage & Classification

## Inventory

| Topic | Producer | Consumer | Status Classification |
|-------|----------|----------|-----------------------|
| `payment.events` | Payment Service | Webhook Service | PARTIALLY_TESTED (Needs retry/failure coverage) |
| `transaction.events` | Transaction Service | (N/A) | IMPLEMENTED_UNTESTED |
| `provider.webhook.events` | Provider Service | Transaction Service | IMPLEMENTED_UNTESTED |
| `provider.normalized.event`| Provider Service | Transaction Service | PARTIALLY_TESTED (Mocked injection only) |
| `payment.intent.created` | Payment Service | Provider Service | OPTIONAL_NOT_IMPLEMENTED |
| `transaction.status.updated`| Transaction Service | Payment Service | PARTIALLY_TESTED (Needs concurrency/ordering tests) |
| `merchant.events` | Merchant Service | (N/A) | IMPLEMENTED_UNTESTED |
| `ledger.events` | Ledger Service | (N/A) | IMPLEMENTED_UNTESTED |

## Analysis
We will focus purely on existing Kafka logic (Phase H, Phase J) instead of building the omitted topics if they are not required for core flow.

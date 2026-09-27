# Kafka Topic Matrix

| Topic Name | Produced By | Consumed By | Consumer Group | Partitions (E2E) | Replication (E2E) |
|------------|-------------|-------------|----------------|------------------|-------------------|
| `payment.events` | `payment-service` | `transaction-service`, `reporting-service`, `webhook-service` | `transaction-group`, `reporting-group`, `webhook-group` | 3 | 1 |
| `transaction.events` | `transaction-service` | `payment-service`, `reporting-service` | `payment-group`, `reporting-group` | 3 | 1 |
| `provider.webhook.events` | API Gateway (Mock) | `payment-service` | `payment-group` | 3 | 1 |
| `merchant.events` | `merchant-service` | `auth-service` | `auth-group` | 3 | 1 |
| `ledger.events` | `ledger-service` | `reporting-service`, `reconciliation-service` | `reporting-group`, `recon-group` | 3 | 1 |

## Topic Bootstrap Rules
- `KAFKA_AUTO_CREATE_TOPICS_ENABLE` MUST be set to `false`.
- The `shared-kafka` TS package must be updated to remove `allowAutoTopicCreation: true`.
- A dedicated Kafka initialization service MUST run before any application service boots. It will execute `kafka-topics.sh` to deterministically create the topics listed above.

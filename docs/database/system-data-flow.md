# System Data Flow

This outlines the high-level data flow through the database architecture for core operations.

## 1. Payment Creation Flow
1. **Client** initiates `POST /payments` with API Key.
2. **API Gateway** routes to **Payment Service**.
3. **Payment Service** -> **Auth/Merchant DB** (via gRPC to Auth/Merchant services): Verifies API Key hash and retrieves `merchant_id`.
4. **Payment Service** -> `payment_db.idempotency_keys`: Inserts key (fails if duplicate).
5. **Payment Service** -> `provider_db` (via gRPC): Checks if requested provider is active and supports currency.
6. **Payment Service** -> `payment_db.payments` & `payment_db.payment_state_history`: Inserts `CREATED` state.
7. **Payment Service** -> Provider API (e.g. Telebirr).
8. **Payment Service** -> `payment_db`: Updates state (`INITIATED` or `UNKNOWN`) and inserts `outbox_events` (in a single DB transaction).
9. **Kafka Relays** -> Ledger Service picks up event and creates `PENDING` journal entry in `ledger_db`.

## 2. Webhook Processing Flow
1. **Provider** sends webhook.
2. **API Gateway** -> **Webhook Service**.
3. **Webhook Service** -> `webhook_db.webhook_events`: Inserts event (fails on provider + external ID unique constraint if duplicate).
4. **Webhook Service** -> Validates signature.
5. **Webhook Service** -> Kafka topic `webhook.received`.
6. **Payment Service** consumes event -> Determines payment state transition (e.g., `PENDING` -> `SUCCEEDED`).
7. **Payment Service** -> `payment_db`: Transactionally updates `payments`, inserts `payment_state_history`, and inserts `outbox_events` (`payment.succeeded`).
8. **Kafka Relays** -> Ledger Service updates `ledger_db` to `SETTLED` (Asset -> Merchant Liability).

## 3. Reconciliation Flow
1. **Cron Job** downloads end-of-day file from Provider.
2. **Reconciliation Service** -> `reconciliation_db.reconciliation_runs`: Creates new run.
3. **Reconciliation Service** -> Parses file into `reconciliation_db.provider_records`.
4. **Reconciliation Service** -> Compares against `transaction_db.transactions` (via API).
5. **Reconciliation Service** -> Writes `reconciliation_matches` and `reconciliation_mismatches` to DB for manual or automated resolution.

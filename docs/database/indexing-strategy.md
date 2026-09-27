# Indexing Strategy

Do not add indexes randomly. Every index must be justified by a query pattern, as indexes slow down writes (which are critical in a payment gateway).

## General Rules
1. **Primary Keys**: PostgreSQL automatically indexes `PRIMARY KEY` (UUIDs).
2. **Foreign Keys**: Always index logical and physical foreign key columns if they are used in `WHERE` clauses (e.g., `payment_db.payments.merchant_id`).
3. **Unique Constraints**: PostgreSQL automatically indexes `UNIQUE` constraints.
4. **Dates/Timestamps**: Index `created_at` or `completed_at` on tables that will be heavily filtered by date ranges (e.g., `payments`, `journal_entries`, `reconciliation_runs`).

## Critical Domain Indexes

### Payment Service
- `idx_payments_merchant_id`: For fetching a merchant's payments.
- `idx_payments_merchant_reference`: For idempotency and lookup by merchant systems.
- `idx_payments_status`: For querying processing/pending payments to reconcile.
- `idx_payments_created_at`: For time-range reports.

### Transaction Service
- `idx_transactions_provider_id_provider_transaction_id`: Vital for webhook lookups where the provider only gives their transaction ID.

### Webhook Service
- `idx_webhook_events_provider_id_external_event_id`: To prevent duplicate processing of the exact same event.

### Ledger Service
- `idx_journal_lines_account_id`: To calculate balances quickly.

### Idempotency
- `uq_idempotency_keys_merchant_id_key`: Critical unique constraint and index.

### Settlement
- `idx_settlement_batches_merchant_id_settlement_date`: For merchant settlement reports.

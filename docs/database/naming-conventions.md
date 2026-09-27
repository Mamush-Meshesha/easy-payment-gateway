# Naming Conventions

## PostgreSQL Object Naming
1. **Tables**: Lowercase, snake_case, plural nouns (e.g., `payments`, `webhook_events`, `journal_entries`).
2. **Columns**: Lowercase, snake_case (e.g., `merchant_id`, `created_at`).
3. **Primary Keys**: Always named `id` within the table.
4. **Foreign Keys**: Named `[entity_singular]_id` (e.g., `payment_id`).
5. **Indexes**: Named `idx_[table_name]_[column1]_[column2]` (e.g., `idx_payments_merchant_id`).
6. **Unique Constraints**: Named `uq_[table_name]_[column1]_[column2]` (e.g., `uq_idempotency_keys_merchant_id_key`).
7. **Timestamps**:
   - Record creation: `created_at` (TIMESTAMPTZ)
   - Record modification: `updated_at` (TIMESTAMPTZ)
   - Lifecycle events: `completed_at`, `deleted_at`, `expires_at`, `revoked_at`, `sent_at` (TIMESTAMPTZ)
8. **Enums**: Uppercase string values in the application, standard VARCHAR or Postgres ENUM in the database. (e.g., `PENDING`, `SUCCEEDED`).
9. **Amounts**: Suffix with nothing if unambiguous, but the companion column MUST be `currency`. e.g. `amount` BIGINT, `currency` VARCHAR(3).
10. **Booleans**: Prefix with `is_`, `has_`, or `supports_` (e.g., `is_active`, `supports_refund`).

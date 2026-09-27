# Database Design Master Specification

This document details the exact table schemas, constraints, indexes, and retention classifications for all databases in the Payment Gateway.

## 1. `auth_db`

### `users`
- **Purpose**: Core identity.
- **Columns**:
  - `id` UUID (PK)
  - `email` VARCHAR(255) (UNIQUE, NULLABLE if phone only)
  - `phone` VARCHAR(50) (UNIQUE, NULLABLE)
  - `status` VARCHAR(20) (DEFAULT 'ACTIVE')
  - `created_at` TIMESTAMPTZ
  - `updated_at` TIMESTAMPTZ
  - `last_login_at` TIMESTAMPTZ (NULLABLE)
- **Classification**: SENSITIVE (Mutable)

### `credentials`
- **Purpose**: Authentication secrets.
- **Columns**:
  - `id` UUID (PK)
  - `user_id` UUID (FK -> `users.id`)
  - `password_hash` VARCHAR(255)
  - `password_changed_at` TIMESTAMPTZ
- **Classification**: SENSITIVE (Mutable)

---

## 2. `merchant_db`

### `merchants`
- **Purpose**: Core merchant entity.
- **Columns**:
  - `id` UUID (PK)
  - `legal_name` VARCHAR(255)
  - `display_name` VARCHAR(255)
  - `status` VARCHAR(20) (DEFAULT 'PENDING')
  - `country` VARCHAR(3)
  - `default_currency` VARCHAR(3)
  - `created_at` TIMESTAMPTZ
- **Classification**: INTERNAL (Mutable)

### `api_keys`
- **Purpose**: Authentication for API access.
- **Columns**:
  - `id` UUID (PK)
  - `merchant_id` UUID (FK -> `merchants.id`)
  - `key_prefix` VARCHAR(50)
  - `key_hash` VARCHAR(255)
  - `status` VARCHAR(20) (DEFAULT 'ACTIVE')
  - `created_at` TIMESTAMPTZ
  - `revoked_at` TIMESTAMPTZ (NULLABLE)
- **Constraints**: UNIQUE(`key_hash`)
- **Indexes**: `idx_api_keys_merchant_id`, `idx_api_keys_key_prefix`
- **Classification**: SENSITIVE (Soft-delete only via `revoked_at`)

---

## 3. `provider_db`

### `providers`
- **Purpose**: Available payment providers (Telebirr, M-PESA, EthSwitch).
- **Columns**:
  - `id` UUID (PK)
  - `code` VARCHAR(50) (UNIQUE)
  - `name` VARCHAR(255)
  - `status` VARCHAR(20)
  - `created_at` TIMESTAMPTZ
- **Classification**: PUBLIC (Mutable)

### `provider_capabilities`
- **Purpose**: Defines what a provider can do.
- **Columns**:
  - `id` UUID (PK)
  - `provider_id` UUID (FK -> `providers.id`)
  - `operation` VARCHAR(50) (e.g. PAYMENT, REFUND)
  - `currency` VARCHAR(3)
  - `supports_refund` BOOLEAN
- **Classification**: INTERNAL (Mutable)

---

## 4. `payment_db`

### `payments`
- **Purpose**: Core financial transaction.
- **Columns**:
  - `id` UUID (PK)
  - `merchant_id` UUID (Logical Ref -> `merchant_db.merchants.id`)
  - `merchant_reference` VARCHAR(255)
  - `amount` BIGINT
  - `currency` VARCHAR(3)
  - `status` VARCHAR(20)
  - `provider_id` UUID (Logical Ref -> `provider_db.providers.id`)
  - `version` BIGINT (Optimistic concurrency locking)
  - `created_at` TIMESTAMPTZ
  - `updated_at` TIMESTAMPTZ
- **Indexes**: `idx_payments_merchant_id`, `idx_payments_merchant_reference`
- **Constraints**: CHECK(`amount > 0`)
- **Classification**: FINANCIAL (Mutable via OCC locking)

### `payment_state_history`
- **Purpose**: Immutable history of payment status transitions.
- **Columns**:
  - `id` UUID (PK)
  - `payment_id` UUID (FK -> `payments.id`)
  - `from_status` VARCHAR(20)
  - `to_status` VARCHAR(20)
  - `reason` VARCHAR(255)
  - `created_at` TIMESTAMPTZ
- **Classification**: INTERNAL (Append-Only)

### `idempotency_keys`
- **Purpose**: Prevent duplicate financial operations.
- **Columns**:
  - `id` UUID (PK)
  - `merchant_id` UUID (Logical Ref)
  - `idempotency_key` VARCHAR(255)
  - `payment_id` UUID (FK -> `payments.id`, NULLABLE if failed)
  - `status` VARCHAR(20)
  - `created_at` TIMESTAMPTZ
- **Constraints**: UNIQUE(`merchant_id`, `idempotency_key`)
- **Classification**: INTERNAL (Hard deletable after 30 days)

### `outbox_events`
- **Purpose**: Transactional outbox for Kafka publishing.
- **Columns**:
  - `id` UUID (PK)
  - `event_type` VARCHAR(100)
  - `payload` JSONB
  - `status` VARCHAR(20) (DEFAULT 'PENDING')
  - `created_at` TIMESTAMPTZ
- **Classification**: INTERNAL (Hard deletable after 7 days)

---

## 5. `transaction_db`

### `transactions`
- **Purpose**: External provider transaction outcomes.
- **Columns**:
  - `id` UUID (PK)
  - `payment_id` UUID (Logical Ref)
  - `provider_id` UUID (Logical Ref)
  - `provider_transaction_id` VARCHAR(255)
  - `amount` BIGINT
  - `currency` VARCHAR(3)
  - `status` VARCHAR(20)
  - `created_at` TIMESTAMPTZ
- **Constraints**: UNIQUE(`provider_id`, `provider_transaction_id`)
- **Classification**: FINANCIAL (Mutable)

---

## 6. `webhook_db`

### `webhook_events`
- **Purpose**: External callback persistence.
- **Columns**:
  - `id` UUID (PK)
  - `provider_id` UUID (Logical Ref)
  - `external_event_id` VARCHAR(255)
  - `event_type` VARCHAR(100)
  - `raw_payload` JSONB
  - `status` VARCHAR(20)
  - `received_at` TIMESTAMPTZ
- **Constraints**: UNIQUE(`provider_id`, `external_event_id`)
- **Classification**: SENSITIVE (Mutable)

---

## 7. `ledger_db`

### `journal_entries`
- **Purpose**: Double-entry accounting header.
- **Columns**:
  - `id` UUID (PK)
  - `reference_type` VARCHAR(50) (e.g., PAYMENT, REFUND)
  - `reference_id` UUID (Logical Ref)
  - `currency` VARCHAR(3)
  - `created_at` TIMESTAMPTZ
- **Classification**: FINANCIAL (Immutable)

### `journal_lines`
- **Purpose**: Debits and Credits.
- **Columns**:
  - `id` UUID (PK)
  - `journal_entry_id` UUID (FK -> `journal_entries.id`)
  - `account_id` UUID (FK -> `accounts.id`)
  - `direction` VARCHAR(10) (DEBIT or CREDIT)
  - `amount` BIGINT
  - `created_at` TIMESTAMPTZ
- **Constraints**: CHECK(`amount > 0`)
- **Classification**: FINANCIAL (Immutable)

---

## 8. `reconciliation_db`

### `reconciliation_runs` & `reconciliation_mismatches`
- **Purpose**: Tracks missing/mismatched transactions.
- **Columns (mismatches)**:
  - `id` UUID (PK)
  - `provider_record_id` UUID
  - `internal_transaction_id` UUID (Logical Ref)
  - `mismatch_type` VARCHAR(50)
  - `status` VARCHAR(20) (UNRESOLVED, RESOLVED)
- **Classification**: INTERNAL (Mutable)

---

## 9. `settlement_db`

### `settlement_batches`
- **Purpose**: Tracks money to be paid to merchants.
- **Columns**:
  - `id` UUID (PK)
  - `merchant_id` UUID (Logical Ref)
  - `gross_amount` BIGINT
  - `fee_amount` BIGINT
  - `net_amount` BIGINT
  - `currency` VARCHAR(3)
  - `status` VARCHAR(20)
  - `settlement_date` DATE
- **Classification**: FINANCIAL (Mutable)

---

## 10. `notification_db`

### `notification_templates`
- **Purpose**: Dynamic templates for SMS/Emails.
- **Columns**:
  - `id` UUID (PK)
  - `name` VARCHAR(255) (UNIQUE)
  - `channel` VARCHAR(50)
  - `subject` VARCHAR(255)
  - `body` TEXT
  - `created_at` TIMESTAMPTZ
  - `updated_at` TIMESTAMPTZ
- **Classification**: INTERNAL

### `notifications`
- **Purpose**: Log of outgoing notifications.
- **Columns**:
  - `id` UUID (PK)
  - `recipient` VARCHAR(255)
  - `channel` VARCHAR(50)
  - `template_id` UUID (FK -> `notification_templates.id`, NULLABLE)
  - `status` VARCHAR(20)
  - `provider` VARCHAR(100)
  - `created_at` TIMESTAMPTZ
  - `sent_at` TIMESTAMPTZ (NULLABLE)
- **Classification**: SENSITIVE (Mutable)

---

## 11. 

### 
- **Purpose**: Defines fraud/velocity rules.
- **Columns**: uid=1000(mamush) gid=1000(mamush) groups=1000(mamush),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),122(lpadmin),135(lxd),136(sambashare),149(wireshark),999(docker), ,  (JSONB), , , , .
- **Classification**: INTERNAL

### 
- **Purpose**: Audit log of risk actions taken on payments.
- **Columns**: uid=1000(mamush) gid=1000(mamush) groups=1000(mamush),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),122(lpadmin),135(lxd),136(sambashare),149(wireshark),999(docker), , , , , , .
- **Classification**: INTERNAL (Immutable)

---

## 12. 

### 
- **Purpose**: Pre-calculated read models for dashboards.
- **Columns**: uid=1000(mamush) gid=1000(mamush) groups=1000(mamush),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),122(lpadmin),135(lxd),136(sambashare),149(wireshark),999(docker), Tue Sep 22 10:36:52 PM EAT 2026, , , , , , etc.
- **Classification**: FINANCIAL (Mutable via daily rollup jobs)

---

## 11. `risk_db`

### `risk_rules`
- **Purpose**: Defines fraud/velocity rules.
- **Columns**: `id`, `name`, `condition` (JSONB), `action`, `is_active`, `created_at`, `updated_at`.
- **Classification**: INTERNAL

### `risk_decisions`
- **Purpose**: Audit log of risk actions taken on payments.
- **Columns**: `id`, `payment_id`, `merchant_id`, `triggered_by`, `action_taken`, `reason`, `created_at`.
- **Classification**: INTERNAL (Immutable)

---

## 12. `reporting_db`

### `payment_daily_summaries`
- **Purpose**: Pre-calculated read models for dashboards.
- **Columns**: `id`, `date`, `merchant_id`, `provider_id`, `currency`, `total_volume`, `succeeded_volume`, etc.
- **Classification**: FINANCIAL (Mutable via daily rollup jobs)

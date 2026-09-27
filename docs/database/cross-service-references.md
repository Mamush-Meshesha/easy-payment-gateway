# Cross-Service Logical References

This document defines where one service refers to an entity owned by another service. These are **logical references** only, NOT PostgreSQL foreign keys.

## `payment_db`
- `merchant_id` -> `merchant_db.merchants.id`
- `provider_id` -> `provider_db.providers.id`

## `transaction_db`
- `payment_id` -> `payment_db.payments.id`
- `merchant_id` -> `merchant_db.merchants.id`
- `provider_id` -> `provider_db.providers.id`

## `webhook_db`
- `provider_id` -> `provider_db.providers.id`
- `payment_reference` -> `payment_db.payments.merchant_reference` (or internal id)

## `ledger_db`
- `owner_id` (when `owner_type` = 'MERCHANT') -> `merchant_db.merchants.id`
- `owner_id` (when `owner_type` = 'PROVIDER') -> `provider_db.providers.id`
- `reference_id` (when `reference_type` = 'PAYMENT') -> `payment_db.payments.id`
- `reference_id` (when `reference_type` = 'REFUND') -> `payment_db.refunds.id`

## `settlement_db`
- `merchant_id` -> `merchant_db.merchants.id`
- `provider_id` -> `provider_db.providers.id`

## `reconciliation_db`
- `provider_id` -> `provider_db.providers.id`
- `internal_transaction_id` -> `transaction_db.transactions.id`

## Constraints Enforcement
Since there are no DB-level foreign keys across these boundaries, referential integrity must be managed at the application level. Before a payment is created, the Payment Service must query the Merchant Service (e.g. via gRPC) to verify the `merchant_id` exists and is `ACTIVE`.

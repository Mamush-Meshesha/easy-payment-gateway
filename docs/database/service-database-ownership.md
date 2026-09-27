# Service Database Ownership

This document defines the database ownership boundaries across the Payment Gateway.

| Service        | Database          | Responsibility         | Main Entities                   |
| -------------- | ----------------- | ---------------------- | ------------------------------- |
| Auth           | `auth_db`         | Authentication         | users, credentials, sessions, roles, permissions, login_attempts, security_events |
| Merchant       | `merchant_db`     | Merchant management    | merchants, merchant_contacts, merchant_settings, api_keys, merchant_provider_configs, merchant_limits, merchant_webhook_configs |
| Payment        | `payment_db`      | Payment lifecycle      | payments, payment_attempts, payment_state_history, idempotency_keys, payment_metadata, payment_customer_snapshots, outbox_events, refunds |
| Transaction    | `transaction_db`  | Provider transactions  | transactions, transaction_references, transaction_status_history |
| Provider       | `provider_db`     | Provider configuration | providers, provider_capabilities, provider_endpoints, provider_health, provider_credentials_metadata, provider_error_mappings, provider_status_mappings |
| Webhook        | `webhook_db`      | External callbacks     | webhook_events, webhook_processing_attempts, webhook_dead_letters |
| Ledger         | `ledger_db`       | Financial accounting   | accounts, account_types, journal_entries, journal_lines, ledger_balances, ledger_adjustments |
| Reconciliation | `reconciliation_db` | Provider comparison  | reconciliation_runs, provider_records, reconciliation_matches, reconciliation_mismatches, reconciliation_actions |
| Settlement     | `settlement_db`   | Settlement tracking    | settlement_batches, settlement_items, settlement_adjustments, settlement_status_history |
| Risk           | `risk_db`         | Risk controls          | risk_rules, risk_limits, risk_decisions, risk_events, merchant_velocity, customer_velocity |
| Notification   | `notification_db` | Notifications          | notifications, notification_attempts, notification_templates |
| Reporting      | `reporting_db`    | Read models/reporting  | payment_daily_summary, merchant_payment_summary, provider_summary, refund_summary, settlement_summary |

## Rule of Ownership
No service may directly connect to a database it does not own. Cross-service data needs must be resolved via gRPC, REST, or asynchronous Kafka events.

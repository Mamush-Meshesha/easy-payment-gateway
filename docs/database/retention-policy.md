# Retention Policy

This document defines the lifecycle and retention periods for all major database entities. 

> [!WARNING]
> Regulatory retention periods for Ethiopian financial data are marked as **TO BE CONFIRMED**. Do not automate deletion/archival until these are legally verified.

| Entity Class | Tables | Retention Period | Action at Expiry | Rationale / Compliance |
|--------------|--------|------------------|------------------|------------------------|
| **Financial Records** | `payments`, `refunds`, `transactions`, `journal_entries`, `journal_lines` | TO BE CONFIRMED (Typically 5-10 years) | Archive to Cold Storage | Anti-Money Laundering (AML) / Financial Audit |
| **Audit Logs** | `audit_logs`, `payment_state_history`, `transaction_status_history` | TO BE CONFIRMED (Typically 5-10 years) | Archive to Cold Storage | Security and Traceability |
| **Idempotency Keys** | `idempotency_keys` | 30 Days | Hard Delete | Only needed to prevent immediate replay attacks/retries. |
| **Webhooks (Processed)** | `webhook_events`, `webhook_processing_attempts` | 90 Days | Hard Delete / Archive | Operational debugging. |
| **Outbox Events** | `outbox_events`, `processed_events` | 7 Days | Hard Delete | Once successfully published/processed, they serve no further purpose. |
| **Merchant Data** | `merchants`, `merchant_settings` | Indefinite (Immutable) | Status -> `DISABLED` | Required for historical references even if merchant leaves. |
| **API Keys / Secrets** | `api_keys` | Indefinite | Revoke (Soft Delete) | Need to know if a compromised key was previously active. |

## Archival vs Deletion
- **Hard Delete**: `DELETE FROM table WHERE...` (Used for ephemeral data like idempotency keys).
- **Soft Delete**: `UPDATE table SET status = 'REVOKED' WHERE...` (Used for credentials).
- **Archive**: Move rows from operational RDS/PostgreSQL to S3/Cold Storage, then DELETE from PostgreSQL. (Used for 5-year-old payments).

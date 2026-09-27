# Data Classification

This document classifies all data fields stored in the Payment Gateway database to enforce strict security, logging, and retention requirements.

## 1. PUBLIC
Non-sensitive data that can be exposed without risk.
- **Examples**: Merchant display names, Provider names, ISO currency codes, error code enums.
- **Rules**: Can be logged freely, displayed on dashboards, and transmitted without special encryption at rest.

## 2. INTERNAL
Internal operational data that doesn't identify individuals or compromise security.
- **Examples**: Internal database UUIDs, version numbers, status strings (`PENDING`, `SUCCEEDED`).
- **Rules**: Can be logged, but should not be unnecessarily exposed in public API responses.

## 3. FINANCIAL
Money-related data requiring strict immutability and auditing.
- **Examples**: Payment amounts, journal entries, ledger balances, settlement amounts.
- **Rules**: Must NEVER be floating point. Must have an accompanying currency. Changes must be append-only via double-entry accounting. Must not be logged in plain text if tied to PII.

## 4. SENSITIVE
Data requiring strict access controls and tokenization/hashing where applicable.
- **Examples**: Customer phone numbers, Merchant API Key Hashes, Password Hashes, email addresses.
- **Rules**: Must NEVER be logged. Must be hashed (bcrypt) in the database. Raw values must not be returned in API queries. 

## 5. SECRET
Highly confidential data that can compromise external systems if leaked.
- **Examples**: Provider API Secrets, Webhook Signing Secrets, TLS Certificates.
- **Rules**: Must NEVER be stored in plain text in PostgreSQL. Should ideally be stored in a dedicated Secret Manager (e.g., AWS Secrets Manager, HashiCorp Vault) and loaded into memory at runtime, or encrypted at rest using a KMS key before storing in the database.

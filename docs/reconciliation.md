# Reconciliation Service

The `reconciliation-service` ensures that our internal double-entry ledger perfectly matches the actual money settled in our bank accounts by external providers (like Telebirr).

## The Need for Reconciliation

In a distributed payment system, discrepancies happen:
- A payment succeeds at the provider, but the webhook drops, and our gateway thinks it's still `UNKNOWN` or `PENDING`.
- We record a successful payment, but the provider rolls it back internally hours later.
- Fee structures change, causing a few cents of mismatch per transaction.

## The Reconciliation Engine

The engine works by doing deterministic matching:

1. **File Upload**: Admins upload end-of-day settlement CSV files provided by the banks/gateways.
2. **Parsing**: The `csv_parser` normalizes the file into a standard format.
3. **Matching**: The `matcher` queries the `ledger-service` (via gRPC) for all transactions in the given time window.
4. **Exception Generation**:
   - **Missing in Ledger**: The provider has money that we didn't record.
   - **Missing in Provider**: We recorded a success, but the provider didn't pay us.
   - **Amount Mismatch**: The provider paid a different amount than expected.

## Exception Handling

When exceptions are generated, they appear in the Admin Dashboard. Support staff must manually investigate these discrepancies and execute an action (e.g., manually confirming a payment, issuing a refund, or writing off a fee discrepancy).

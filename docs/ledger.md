# Ledger Service & Double-Entry Accounting

The `ledger-service` is the financial source of truth for the entire payment gateway. It enforces strict double-entry accounting principles to ensure money is never created or destroyed without a balanced entry.

## Core Concepts

1. **Accounts**: Every financial entity in the system has a corresponding account in the ledger.
   - Merchant Accounts (Liability)
   - Platform Revenue Accounts (Asset/Equity)
   - Provider Clearing Accounts (Asset)
   - Tax/VAT Accounts (Liability)

2. **Journal Entries (Transactions)**: A transaction consists of multiple *postings* (debits and credits) that must mathematically sum to zero.

## Example: A Payment Transaction

When the `payment-service` successfully captures a 100 ETB payment via Telebirr (with a 2 ETB platform fee):

1. The `payment-service` publishes a `PaymentSucceeded` Kafka event.
2. The `ledger-service` consumes this event and creates a balanced Journal Entry:
   - **Debit**: Telebirr Clearing Account (+100 ETB)
   - **Credit**: Merchant Balance Account (-98 ETB)
   - **Credit**: Platform Revenue Account (-2 ETB)

*Note: In normal accounting terms for a payment processor, merchant balances are a liability to the platform (we owe them money), hence they are credited. Clearing accounts are assets (we have the money at the provider).*

## Immutability

Journal entries are **strictly immutable**. 
If a mistake is made, or a refund occurs, the original entry cannot be modified or deleted. Instead, a new *reversing* journal entry must be created to offset the original balances.

## Concurrency & SavePoints

The ledger service utilizes PostgreSQL transaction blocks and optimistic concurrency control to ensure that account balances do not suffer from race conditions when thousands of concurrent payments are hitting the same merchant account.

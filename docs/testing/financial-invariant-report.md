# Financial Invariant Report

## Overview
This document tracks the testing of core financial and accounting invariants. A financial system is mathematically correct only if these invariants hold under all concurrency, failure, and edge-case scenarios.

## Invariants

1. **Double-Entry Balance (Ledger)**
   - **Rule:** `sum(debits) == sum(credits)` for every journal entry.
   - **Tested:** NO. We need a script to assert database-level totals.
   
2. **Double-Spend Prevention (Idempotency)**
   - **Rule:** A single payment intent (`Idempotency-Key`) must result in at most ONE provider execution and ONE ledger debit.
   - **Tested:** PARTIAL. We tested immediate consecutive REST calls, but not concurrent gRPC provider timeouts.

3. **Settlement Constraint**
   - **Rule:** Settled Amount + Reserved Amount <= Available Balance.
   - **Tested:** NO. Settlement flows have not been tested.

4. **Currency Matching**
   - **Rule:** A payment crossing Provider, Transaction, and Ledger must retain the exact same minor-unit integer amount and currency.
   - **Tested:** NO. Mismatch tests (e.g. Provider returning `USD` for a `EUR` intent) are missing.

5. **Refund Limits**
   - **Rule:** Total Refunded <= Original Payment Amount.
   - **Tested:** NO. Refunds are currently unverified.

## Required Actions
Construct a dedicated `07-ledger-invariants.sh` test that issues parallel payments, modifies amounts maliciously during provider callbacks, and triggers timeouts, then runs a database aggregate query asserting `sum(debit) - sum(credit) = 0`.

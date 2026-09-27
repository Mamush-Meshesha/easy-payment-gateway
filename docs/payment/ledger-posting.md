# Ledger Posting

The Ledger Service owns double-entry accounting. The Payment Service acts as the client requesting journal entries.

## The Rule of Ledger Idempotency
Ledger operations are inherently risky because they mutate the core financial balances. 
To guarantee safety:
- **Reference IDs**: The Payment Service passes its `payment_id` as the `reference_id` to the Ledger Service.
- **Ledger Guarantee**: The Ledger Service guarantees that multiple calls with the same `reference_type=PAYMENT` and `reference_id=<payment_id>` will result in exactly ONE journal entry.

## Handling Ledger Failures
If the Provider reports SUCCESS, the Payment Service calls the Ledger.

1. **Success**: Ledger returns `COMMITTED`. Payment transitions to `SUCCEEDED`.
2. **Timeout/Unavailable**:
   - The Ledger call times out.
   - Payment transitions to `COMPLETION_PENDING`.
   - **Recovery**: A background worker continuously polls `COMPLETION_PENDING` payments and re-attempts the Ledger gRPC call. Because the Ledger is idempotent, it is perfectly safe to retry this indefinitely until success.
3. **Deterministic Ledger Reject**:
   - Extremely rare (e.g., negative balance on a merchant account preventing a payout). 
   - Payment transitions to `UNKNOWN` or requires manual administrative intervention. The external provider has already moved money, so we cannot simply mark it `FAILED`.

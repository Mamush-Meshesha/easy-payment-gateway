# Settlement Service

The `settlement-service` controls the flow of money out of the platform and into the merchant's actual bank accounts.

## Settlement Lifecycle

Unlike payment capture, settlement is a multi-step batch process.

1. **Balance Check**: The service periodically queries the `ledger-service` for merchant accounts whose available balance exceeds their minimum settlement threshold.
2. **Instruction Generation**: A settlement instruction is created, grouping multiple payments into a single payout amount, minus settlement fees.
3. **Ledger Hold**: A journal entry is immediately posted to move the funds from the merchant's `Available Balance` account to a `Settlement In Progress` liability account. This prevents the merchant from double-spending or refunding money that is actively being paid out.
4. **Provider Payout**: The `provider-service` is instructed to execute a bank transfer via the specific provider network (e.g., an EthSwitch push).
5. **Finalization**: 
   - On **Success**: The ledger moves the funds from `Settlement In Progress` to `Settlement Cleared`.
   - On **Failure**: The ledger reverses the funds back to the `Available Balance`.

## Payout State Machine

Settlements can take days to clear via traditional banking rails. The service maintains a state machine:
- `PENDING`: Instruction created, waiting for execution window.
- `SUBMITTED`: Sent to the bank/provider.
- `CLEARED`: Bank confirmed the transfer.
- `REJECTED`: Bank rejected the account details or transfer.

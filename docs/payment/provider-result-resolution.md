# Provider Result Resolution

When the Payment Service initiates a provider request and the provider times out or the connection drops, the payment transitions to `UNKNOWN`.

## Resolving UNKNOWN States

The `UNKNOWN` state means the external operation *might* have occurred. We must not blindly retry it.

### Mechanisms for Resolution
1. **Asynchronous Webhooks**:
   - The provider sends a success/failure callback to our `Webhook Service`.
   - `Webhook Service` publishes to Kafka.
   - `Transaction Service` consumes and publishes an internal status update.
   - `Payment Service` consumes the update and transitions `UNKNOWN` -> `COMPLETION_PENDING` (if success) or `FAILED` (if declined).
2. **Background Status Polling (Reconciliation Job)**:
   - A background worker in the `Transaction Service` periodically queries the provider's `GET /status` API for all `UNKNOWN` or `PENDING` transactions older than X minutes.
   - Once resolved, the same event pipeline is used to inform the `Payment Service`.

## Provider Double-Charge Protection
Even if the Payment Service crashes and restarts, the `idempotency_key` mapped to the provider request ensures that if a manual retry is ever triggered, the Provider Service will pass the same idempotency token to the external provider (if supported), preventing a double charge.

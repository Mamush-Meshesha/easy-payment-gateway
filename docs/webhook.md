# Webhook Service Architecture

The `webhook-service` is responsible for asynchronously delivering state changes to external merchant systems. Since we cannot trust external merchant servers to be fast or reliable, webhook delivery must be decoupled from the core payment engine.

## Architecture & Data Flow

1. **Event Ingestion**: The `payment-service` publishes state changes (e.g., `PaymentSucceeded`, `PaymentFailed`) to a Kafka topic via the Outbox pattern.
2. **Consumption**: The `webhook-service` consumes these Kafka messages.
3. **Dispatching**: A pool of worker goroutines processes the deliveries.
4. **Delivery**: The HTTP client attempts to POST the payload to the merchant's configured webhook URL.

## Retry Policy & Exponential Backoff

If a merchant's server returns a non-200 HTTP status code, or if the request times out, the webhook enters a retry loop.

- **Immediate Retry**: We retry up to 3 times with exponential backoff (e.g., 2s, 4s, 8s).
- **Dead-Letter Queue (DLQ)**: If all retries fail, the webhook is marked as `FAILED` and persisted in the database.
- **Manual Replay**: Merchants can trigger a manual replay of a failed webhook from their dashboard.

## Security & Signature (HMAC)

To prove that a webhook originated from our gateway and the payload hasn't been tampered with, every webhook request includes an `X-Signature` header.

1. The signature is an HMAC-SHA256 hash.
2. The key is the merchant's webhook secret (generated in their dashboard).
3. The payload is the raw JSON body of the webhook.

**Verification Example (Node.js)**:
```javascript
const crypto = require('crypto');
const signature = crypto.createHmac('sha256', WEBHOOK_SECRET)
                        .update(rawBody)
                        .digest('hex');

if (req.headers['x-signature'] !== signature) {
    return res.status(401).send('Invalid Signature');
}
```

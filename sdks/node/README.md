# @payment-gateway/node

The official Node.js SDK for the Payment Gateway.

## Installation

```bash
npm install @payment-gateway/node
```

## Quick Start

### Initialize the SDK

```typescript
import { PaymentGateway } from '@payment-gateway/node';

const gateway = new PaymentGateway('sk_test_a1b2c3d4e5f67890');
```

### Create a Payment

```typescript
try {
  const payment = await gateway.payments.create({
    merchantReference: 'order-12345',
    amount: 5000, // Amount in cents (e.g., 50.00)
    currency: 'ETB',
    paymentMethod: 'TELEBIRR',
    providerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  });

  console.log('Payment created:', payment.id, payment.status);
} catch (error) {
  if (error.name === 'ValidationError') {
    console.error('Invalid payment details:', error.message);
  } else if (error.name === 'AuthenticationError') {
    console.error('Invalid API key');
  } else {
    console.error('Failed to create payment:', error);
  }
}
```

### Refund a Payment

```typescript
const refund = await gateway.payments.refund('payment-uuid-here', {
  amount: 2500, // Partial refund
  reason: 'Customer requested cancellation'
});
```

### Verify Webhooks

```typescript
import express from 'express';

const app = express();
const WEBHOOK_SECRET = 'whsec_...';

// Important: Parse raw body for signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = req.body.toString('utf8');

  try {
    // Verifies HMAC-SHA256 signature
    gateway.webhooks.verifySignature(payload, signature, WEBHOOK_SECRET);
    
    const event = JSON.parse(payload);
    console.log('Received valid webhook:', event.type);
    
    // Process event...
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook verification failed:', error.message);
    res.status(400).send('Invalid signature');
  }
});
```

## Error Handling

The SDK throws standardized errors inheriting from `GatewayError`. You can switch on error names or the machine-readable `code` property.

- `AuthenticationError` (401)
- `IdempotencyError` (409)
- `ValidationError` (400)
- `APIConnectionError` (Network issues)

```typescript
import { GatewayError } from '@payment-gateway/node';

try {
  // ...
} catch (error) {
  if (error instanceof GatewayError) {
    console.log(error.code); // e.g., 'insufficient_funds', 'risk_rejected'
    console.log(error.reference); // Trace ID for support
  }
}
```

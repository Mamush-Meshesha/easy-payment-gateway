# Provider Integration Guide

The `provider-service` handles the translation between our internal standard payment model and the varied external APIs of Ethiopian banks and mobile money platforms.

## Core Abstraction

To ensure the orchestration logic inside the `payment-service` never needs to change when we add a new provider, all integrations must conform to a standardized gRPC interface:

```protobuf
service ProviderService {
  rpc InitiatePayment(InitiatePaymentRequest) returns (InitiatePaymentResponse);
  rpc RefundPayment(RefundPaymentRequest) returns (RefundPaymentResponse);
  rpc QueryStatus(QueryStatusRequest) returns (QueryStatusResponse);
}
```

## Adding a New Provider

New providers are added as separate files inside `services/provider-service/internal/integration/`. 

### Required Interfaces
A new provider must implement the `ProviderIntegration` Go interface:

```go
type ProviderIntegration interface {
    InitiatePayment(ctx context.Context, p *domain.Payment) (domain.ProviderStatus, error)
    RefundPayment(ctx context.Context, refund *domain.Refund) error
    QueryStatus(ctx context.Context, paymentID string) (domain.ProviderStatus, error)
}
```

### 1. Telebirr Implementation Example (`telebirr.go`)
- **Encryption**: Uses RSA public key encryption for the payload.
- **Signing**: Uses SHA-256 with the merchant's private key.
- **Callback**: Responds to async callbacks sent by Telebirr after the customer enters their PIN on their mobile device.

## Timeout & Failure Policy

- **Fail-Fast**: If the external provider returns an explicit HTTP 400 or 403, the adapter immediately returns an error.
- **Ambiguous States (Timeouts)**: If the HTTP request times out (e.g., 504 Gateway Timeout), the adapter MUST NOT return a failure. It must return a specific timeout error, which the orchestrator translates to the `UNKNOWN` state. A background job will then use the `QueryStatus` RPC to poll the provider until a definitive success or failure state is reached.

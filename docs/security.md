# Security Architecture

Our payment gateway handles sensitive financial data. Security is enforced at every layer of the application via strict isolation, zero-trust communication, and cryptographic signing.

## 1. External Authentication (API Keys)

Merchants communicate with the gateway via REST APIs authenticated with Bearer API keys.
- **Key Prefixing**: Keys are prefixed with `sk_live_` or `sk_test_` to clearly distinguish environments and prevent catastrophic misconfiguration.
- **Key Storage**: Raw API keys are *never* stored in the database. We store an SHA-256 hash. When a request comes in, the provided key is hashed and compared to the database.
- **Validation**: The `payment-service` does not have access to the merchant database. It performs a synchronous gRPC call to the `merchant-service` to validate the key on every request.

## 2. Internal Authorization (mTLS & gRPC)

We employ a Zero-Trust internal network model.

- **mTLS**: Every microservice communicates over gRPC secured by mutual TLS. The client verifies the server's certificate, and the server verifies the client's certificate.
- **Service Identity**: Certificates contain the specific identity of the calling service.
- **Interceptors**: gRPC interceptors enforce authorization policies. For example, the `ledger-service` rejects any transaction posting request unless the client certificate specifically identifies the caller as the `payment-service` or `settlement-service`.

## 3. Webhook Integrity (HMAC)

To protect merchants from malicious actors spoofing payment success callbacks:
- Every webhook contains an `X-Signature` header.
- The signature is an HMAC-SHA256 hash of the payload using the merchant's secret webhook key.

## 4. Tenant Isolation

All SQL queries in merchant-facing services strictly include a `WHERE merchant_id = $1` clause to enforce tenant isolation at the database level.

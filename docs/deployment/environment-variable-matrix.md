# Environment Variable Matrix

This matrix defines the required environment variables for the deployment of the Payment Gateway.

### Global/Infrastructure Configuration
- `DATABASE_URL`: `postgresql://postgres:postgres@postgres:5432/payment_gateway?sslmode=disable`
- `REDIS_URL`: `redis://redis:6379`
- `KAFKA_BROKERS`: `kafka:9092`

### Security & Authorization
- `JWT_SECRET`: Used by `auth-service`, and decoded by TS controllers (BFFs, reporting).
- `API_SECRET`: Used by `merchant-service` for generating API keys.

### mTLS / SPIFFE Identity
Required for all Go gRPC servers and TS gRPC clients:
- `MTLS_CA_CERT`: `/app/certs/ca.crt`
- `MTLS_SERVER_CERT`: `/app/certs/<service-name>.crt`
- `MTLS_SERVER_KEY`: `/app/certs/<service-name>.key`

### Internal gRPC Routing
- `LEDGER_GRPC_ADDR`: `ledger-service:50051`
- `RISK_GRPC_ADDR`: `risk-service:50054`
- `PROVIDER_GRPC_ADDR`: `provider-service:50055`
- `PAYMENT_GRPC_ADDR`: `payment-service:50053`

### External Dependencies
- `TELEBIRR_API_URL`: `http://localhost:9999/telebirr` (Inject into provider-service)
- `MPESA_API_URL`: `http://localhost:9999/mpesa` (Inject into provider-service)

### Port Configuration
- `PORT`: (HTTP Port per service)
- `GRPC_PORT`: (gRPC Port per Go service)

### OpenTelemetry
- `OTEL_EXPORTER_OTLP_ENDPOINT`: E.g. `http://jaeger:4318`
- `OTEL_SERVICE_NAME`: The name of the service for distributed tracing.

# Service Dependency Matrix

| Service | Stack | Runtime Dependencies (S2S) | Required Infrastructure | HTTP Port | gRPC Port | Health Endpoint |
|---------|-------|----------------------------|-------------------------|-----------|-----------|-----------------|
| `auth-service` | TS | None | Postgres, Redis, Kafka | 3001 | - | `/health` (Expected) |
| `merchant-service` | TS | Auth (JWT) | Postgres, Kafka | 3002 | - | `/health` (Expected) |
| `payment-service` | Go | Merchant, Risk, Provider, Ledger | Postgres, Kafka | 3003 | 50053 | `/health` (Expected) |
| `transaction-service`| Go | None (Listens to Kafka) | Postgres, Kafka | 3004 | - | `/health` (Expected) |
| `provider-service` | Go | External Provider APIs | Postgres, Kafka | 3005 | 50055 | `/health` (Expected) |
| `webhook-service` | Go | None (Listens to Kafka) | Postgres, Kafka | 3006 | - | `/health` (Expected) |
| `notification-service`| TS | None (Listens to Kafka) | Postgres, Kafka | 3007 | - | `/health` (Expected) |
| `reporting-service` | TS | Ledger (Read) | Postgres, Kafka | 3008 | - | `/health` (Expected) |
| `dashboard-service` | TS | Auth, Merchant, Payment | Redis | 3009 | - | `/health` (Expected) |
| `admin-service` | TS | Auth, Risk, Reporting | None | 3010 | - | `/health` (Expected) |
| `risk-service` | Go | None | Postgres, Redis | - | 50054 | `/health` (Expected) |
| `ledger-service` | Go | None | Postgres | - | 50051 | `/health` (Expected) |
| `settlement-service` | Go | Ledger | Postgres, Kafka | - | ? | `/health` (Expected) |
| `reconciliation-service`|Go | Ledger | Postgres, Kafka | - | ? | `/health` (Expected) |

*Note: The actual S2S gRPC topology dictates runtime dependencies. Startup must only depend on Infrastructure (Postgres/Kafka/Redis) being healthy.*

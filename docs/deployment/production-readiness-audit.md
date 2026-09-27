# Production Readiness Audit

## Architecture Overview
The system consists of 14 microservices (8 Go, 6 Node/TypeScript). The architecture aims to follow production-grade practices, including mTLS identity isolation, Kafka-based async orchestration, and strictly separate end-user authentication from S2S (service-to-service) authorization.

## Found Gaps & Technical Debt

### 1. Database Migrations
- **Go Services** (`Payment`, `Transaction`, `Provider`, `Webhook`, `Risk`, `Ledger`) currently use GORM's `db.AutoMigrate` on startup. This is **Technical Debt**. Production deployments should use deterministic migration systems (like `goose` or `golang-migrate`) separated from application boot.
- **Node/TS Services** (`Auth`, `Merchant`, `Notification`, `Reporting`) use Prisma. The current Dockerfiles lack explicit database schema migrations (`prisma migrate deploy`) during the startup sequence, meaning schemas are never pushed to the local Postgres container.

### 2. Startup Scripts & Runtimes
- TS Services define `CMD ["npm", "start"]` in their Dockerfiles, but their `package.json` configurations do not contain `"start"` scripts. These containers crash immediately.
- The compiled/runtime architecture relies on `tsc` to build the TS output to `dist/`, but `package.json` needs to correctly point to `node dist/app.js` or `ts-node src/app.ts` as the start mechanism.

### 3. Kafka Auto-Topic Creation
- The `docker-compose.yml` sets `KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true`. In production, this must be false, and topics must be initialized deterministically via a separate mechanism (e.g. `kafka-topics.sh` or an init-container).
- Shared library `shared-kafka` currently has `allowAutoTopicCreation: true` hardcoded.

### 4. mTLS Certificate Isolation
- `generate-mtls.sh` successfully creates separate root CA, server certificates, and private keys for each service with properly formatted SPIFFE URIs (`spiffe://payment-gateway/ns/production/sa/<service>`).
- However, the `docker-compose.yml` does not mount these isolated certificates. Consequently, Go gRPC services fail on startup due to missing TLS files.

### 5. Healthchecks & Startup Coordination
- Standard `depends_on` only verifies the container process started, not that the infrastructure (Postgres, Kafka, Redis) is healthy. `pg_isready`, `redis-cli ping`, and broker validation are required.

## Next Steps for E2E Local Bring-up
- Add a Kafka init container to create topics.
- Add migration init containers for Prisma services (`npx prisma migrate deploy`).
- Configure healthchecks in `docker-compose.yml`.
- Fix missing `"start"` scripts in TS services.
- Correctly mount strictly isolated mTLS certificates.

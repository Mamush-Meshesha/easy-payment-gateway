# V2 Production Hardening Plan

This document outlines the final steps and architectural requirements required to transition the payment gateway from the validated local-orchestration (v1) to a full-scale production environment (v2).

## 1. Zero-Trust and Network Hardening
- **Service Mesh (Istio / Linkerd):** Replace manually provisioned mTLS and `go-grpc-auth` SPIFFE spoofing checks with an envoy-based service mesh. The mesh will handle transparent mTLS, certificate rotation, and L7 RBAC authorization policies.
- **WAF & API Gateway:** Replace the local Nginx proxy with a managed API Gateway (e.g., AWS API Gateway or Kong) equipped with a Web Application Firewall (WAF) to defend against DDoS and Layer 7 injection attacks.
- **Private Subnets:** All databases (RDS, ElastiCache), event buses (MSK), and internal microservices must reside in isolated private subnets, accessible only via secure bastion hosts or SSM.

## 2. Distributed Tracing & Observability
- **OpenTelemetry Collector:** Deploy an OTel collector sidecar to aggregate metrics, traces, and logs from all services.
- **Trace Context Propagation:** While `trace_id` and `correlation_id` are already propagated across gRPC and Kafka, these must be exported to a robust backend (e.g., Jaeger, Honeycomb, Datadog) to visualize async Sagas and identify bottlenecks.
- **Alerting & SLIs:** Define Service Level Indicators (SLIs) for payment processing latency, Kafka consumer lag, and webhook delivery success rates. Configure automated PagerDuty alerts on Service Level Objective (SLO) breaches.

## 3. Database Scaling & Immutability
- **Partitioning:** Implement PostgreSQL `PARTITION BY RANGE` for high-velocity tables (`journal_lines`, `webhook_events`, `payments`) to manage billions of rows.
- **Database Triggers:** Transition from application-enforced immutability to database-level PostgreSQL triggers that outright reject `UPDATE` or `DELETE` statements on critical tables (e.g., Ledger entries, Payment history).
- **Raw SQL Migrations:** Replace `GORM` and `Prisma` AutoMigrate with deterministic, versioned raw SQL migrations (using `goose` or `golang-migrate`) integrated into the CI/CD pipeline.

## 4. Encryption & Data Privacy
- **Application-Level Encryption (ALE):** Encrypt highly sensitive PII and merchant API keys in application memory using KMS data keys before persisting them to the database.
- **Tokenization:** Externalize PCI-DSS scoped data (if accepting direct cards) to a compliant tokenization vault (e.g., VGS) so the core platform only interacts with non-sensitive tokens.

## 5. Resilience & Chaos Engineering
- **Active-Active Multi-Region:** Expand the Terraform AWS configuration to support multi-region deployments with asynchronous cross-region replication for RDS and Kafka.
- **Fault Injection:** Introduce chaos testing (e.g., Gremlin or AWS FIS) in staging to continuously validate the Outbox pattern, idempotency constraints, and the asynchronous Saga orchestrators against simulated node terminations, network partitions, and database failovers.

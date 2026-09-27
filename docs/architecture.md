# System Architecture

## High-Level Architecture

```mermaid
flowchart TD
    CLIENTS[CLIENTS]

    subgraph Clients Area
        MA[Merchant Apps]
        AA[Admin Apps]
    end

    CLIENTS --> MA
    CLIENTS --> AA

    MA --> GATEWAY
    AA --> GATEWAY

    GATEWAY[API GATEWAY\nNginx/Kong]

    subgraph Express/TypeScript Services
        AUTH[Auth Service]
        MERCHANT[Merchant Service]
        ADMIN[Admin Service]
        DASHBOARD[Dashboard API]
        NOTIFICATIONS[Notifications]
        REPORTING[Reporting API]
    end

    subgraph Go Services
        PAYMENT[Payment Engine]
        PROVIDER[Provider Engine]
        LEDGER[Ledger]
        RECONCILIATION[Reconciliation]
        SETTLEMENT[Settlement]
        TRANSACTION[Transaction Service]
        WEBHOOK[Webhook Service]
    end

    GATEWAY --> AUTH
    GATEWAY --> MERCHANT
    GATEWAY --> ADMIN
    GATEWAY --> DASHBOARD
    GATEWAY --> NOTIFICATIONS

    GATEWAY --> PAYMENT
    GATEWAY --> PROVIDER
    GATEWAY --> LEDGER
    GATEWAY --> RECONCILIATION
    GATEWAY --> SETTLEMENT
    GATEWAY --> TRANSACTION
    GATEWAY --> WEBHOOK

    AUTH -. gRPC / Kafka .-> PAYMENT
    MERCHANT -. gRPC / Kafka .-> PAYMENT
    PAYMENT -. gRPC / Kafka .-> PROVIDER
    SETTLEMENT -. gRPC / Kafka .-> LEDGER

    DB[(PostgreSQL)]
    CACHE[(Redis)]
    KAFKA{{Kafka Event Bus}}

    AUTH --> DB
    PAYMENT --> DB
    LEDGER --> DB
    
    PAYMENT --> CACHE
    
    AUTH --> KAFKA
    PAYMENT --> KAFKA
    LEDGER --> KAFKA
    WEBHOOK --> KAFKA

    subgraph Consumers
        NOTIF_CONS[Notification Consumers]
        FRAUD_CONS[Fraud/Risk Consumers]
        ANALYTICS_CONS[Analytics Consumers]
    end

    KAFKA --> NOTIF_CONS
    KAFKA --> FRAUD_CONS
    KAFKA --> ANALYTICS_CONS

    subgraph External Providers
        TELEBIRR[Telebirr]
        MPESA[M-PESA]
        ETHSWITCH[EthSwitch]
    end

    PROVIDER --> TELEBIRR
    PROVIDER --> MPESA
    PROVIDER --> ETHSWITCH

    subgraph Financial Institutions
        BANK_A[Banks]
        BANK_B[Banks]
        FSP[FSPs]
    end

    TELEBIRR --> BANK_A
    MPESA --> BANK_B
    ETHSWITCH --> FSP
```

## Language Split

| Area | Language | Why |
|---|---|---|
| Payment engine | **Go** | concurrency, performance, financial core |
| Provider engine | **Go** | external integrations + resilient I/O |
| Ledger | **Go** | correctness + transactional processing |
| Reconciliation | **Go** | large transaction processing |
| Settlement | **Go** | financial processing |
| Webhooks | **Go** | high-throughput callbacks |
| Transaction | **Go** | state management |
| Auth | **Express + TS** | business/API layer |
| Merchant | **Express + TS** | CRUD/business management |
| Admin | **Express + TS** | management API |
| Dashboard API | **Express + TS** | frontend-oriented APIs |
| Notifications | **Express + TS** | simpler integration |
| Reporting API | **Express + TS** | data aggregation |
| Event bus | **Kafka** | async communication |
| Internal RPC | **gRPC** | synchronous service communication |
| Primary DB | **PostgreSQL** | transactional source of truth |
| Cache/limits | **Redis** | non-authoritative fast state |
| Observability | **Prometheus + Grafana + OpenTelemetry** | metrics/tracing |

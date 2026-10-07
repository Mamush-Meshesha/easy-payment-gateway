# V3 Enterprise Architecture Roadmap (Tier-1 Gateway Standards)

This document outlines the strategic roadmap for evolving the Payment Gateway from a highly robust Tier-2 orchestrator into a true **Tier-1 Global Payment Network** (on par with Stripe, Adyen, and Braintree). 

The roadmap is strictly phased to manage architectural complexity, ensuring zero downtime and maintaining absolute financial consistency throughout the upgrade cycle.

---

## Phase 20: PCI-DSS Core & Tokenization (`vault-service`)
**Objective**: Shift from solely orchestrating third-party wallets to directly acquiring and vaulting credit cards (PANs) securely, eliminating raw card data from the primary `payment-service`.

1. **`vault-service` (Go)**:
   - **Infrastructure**: Must run in an isolated network enclave (strict egress/ingress firewalls) with dedicated database.
   - **Encryption**: Implement Envelope Encryption using AWS KMS or HashiCorp Vault. Data encryption keys (DEK) are rotated automatically.
   - **gRPC API**: `TokenizeCard(PAN, Expiry, CVV) -> tok_123`, `DetokenizeCard(tok_123) -> PAN (Internal Only)`.
   - **mTLS Restriction**: Only the `payment-service` and `provider-service` are authorized to call `vault-service`.
2. **Frontend `Elements` Library**:
   - Build a lightweight `iframe` based frontend library (like Stripe Elements) that posts raw card data directly to the `vault-service`, returning a token to the merchant's checkout page, ensuring the merchant's server never touches PCI data.

## Phase 21: Smart Routing & Treasury Operations (`routing-service` & `fx-service`)
**Objective**: Dynamically route payments to the highest-converting acquiring bank and manage multi-currency settlements safely.

1. **`routing-service` (Go)**:
   - **BIN Lookup**: Analyze the Bank Identification Number (first 6 digits) to determine card type, issuing bank, and country.
   - **Dynamic Routing Engine**: Route transactions based on:
     - Lowest interchange fees.
     - Acquiring bank uptime/health.
     - Authorization success rate history.
2. **`fx-service` (Go)**:
   - **Real-Time Rates**: Connect to Forex APIs (e.g., Bloomberg, Fixer) to fetch and cache exchange rates every 5 seconds via Redis.
   - **Dynamic Currency Conversion (DCC)**: Allow a merchant to charge in USD while settling in EUR, locking the exchange rate synchronously during the `PaymentService` Saga.
   - **Treasury Ledger Extension**: Add multi-currency liability tracking to the existing `ledger-service`.

## Phase 22: Advanced Risk & 3DS2 Engine
**Objective**: Move from basic velocity checks to predictive fraud detection and liability shifting.

1. **Machine Learning Pipeline**:
   - Emit `risk.evaluation.requested` Kafka events.
   - Deploy a Python/TensorFlow microservice that evaluates device fingerprint, IP geolocation, proxy/VPN usage, and email age.
   - Output a risk score (0-100) back to the synchronous orchestrator.
2. **3D Secure 2.0 (3DS2) Fallback**:
   - If the risk score is between 70-85, dynamically respond to the client with `status: requires_action` and a `next_action.url`.
   - The frontend iframe redirects the user to their issuing bank's OTP/biometric challenge.
   - On successful challenge, liability shifts to the issuer and the payment resumes via webhook.

## Phase 23: Global Compliance & Continuous AML
**Objective**: Automate Anti-Money Laundering (AML) and continuous merchant screening.

1. **`compliance-worker` (Node/TypeScript)**:
   - Run nightly cron jobs pulling all active merchant profiles.
   - Integrate with external APIs (Chainalysis for crypto, Onfido/ComplyAdvantage for fiat).
   - Screen against updated global PEP (Politically Exposed Persons) and Sanctions lists (OFAC).
2. **Automated Account Freezing**:
   - If a high-confidence match occurs, automatically dispatch a `merchant.suspended` event.
   - The `ledger-service` listens to this event and instantly places a `FROZEN` lock on the merchant's master account, preventing any payouts/settlements.

## Phase 24: Dispute Automation Network Integrations
**Objective**: Replace manual dashboard dispute handling with programmatic Visa/Mastercard resolution.

1. **Network Integrations (`dispute-worker`)**:
   - Integrate directly with Visa Resolve Online (VROL) and MasterCom APIs.
   - Continuously poll for newly initiated chargebacks and automatically pull them into our `Dispute` database.
2. **Automated Evidence Submission**:
   - Allow merchants to map their internal shipping/IP logs via API.
   - Programmatically compile a PDF/JSON evidence packet and submit it to the network API before the `dueBy` date.
3. **Ledger Auto-Reversal**:
   - Automatically debit the merchant's ledger when a chargeback is lost, including network dispute fees.

## Phase 25: Hyper-Scale Database Architecture
**Objective**: Ensure the database layer can survive 100M+ rows and massive concurrency without degrading.

1. **Row-Level Security (RLS)**:
   - Implement PostgreSQL RLS policies on `payments`, `journal_lines`, and `refunds` using `current_setting('app.merchant_id')`.
   - Pass the `MerchantID` from the gRPC `RequestContext` directly into the Postgres session variable, ensuring tenant isolation is guaranteed by the database engine itself.
2. **Table Partitioning**:
   - Convert `journal_lines` and `payment_state_history` to use `PARTITION BY RANGE (created_at)` (e.g., partitioning monthly).
   - Implement an automated cron script to generate next month's partition tables.

## Phase 26: Developer Experience V2
**Objective**: Provide enterprise-grade webhook management and data hygiene.

1. **Webhook Secret Rolling**:
   - Update `webhook-service` to support storing two active HMAC secrets (`primary` and `secondary`) with an expiration date on the secondary.
   - The Dispatcher uses the `primary` to sign payloads, but verifies against both during rotation.
2. **Idempotency Pruning**:
   - Implement a background worker to archive or delete idempotency keys older than 30 days to prevent unbound database growth in `payment-service`.

## Phase 27: Multi-Region Active-Active Architecture
**Objective**: Survive total AWS Region loss (e.g., `us-east-1` goes down).

1. **Global Database**:
   - Migrate PostgreSQL to a globally distributed, synchronously replicated SQL engine (e.g., CockroachDB, Aurora Global Database).
2. **Kafka MirrorMaker**:
   - Deploy MSK clusters in two regions (`us-east-1` and `eu-west-1`).
   - Configure MirrorMaker 2.0 for asynchronous cross-region replication of event streams.
3. **Global Traffic Routing**:
   - Implement AWS Route53 latency-based routing to direct merchants to the closest healthy gateway region.

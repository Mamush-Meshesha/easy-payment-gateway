# Remaining Test Gap Analysis

## Overview
This document compares the actual repository architecture (REST endpoints, gRPC RPCs, Kafka topics, and state machines) against the subset of tests currently executed in the CI suite (`01-s2s.sh`, `02-auth-security.sh`, `03-idempotency.sh`, `04-async-events.sh`).

The existing suite validates:
- Basic Gateway routing
- Basic Tenant isolation (Merchant A vs B API keys)
- Basic JWT/RBAC
- Same-request idempotency
- Happy-path Kafka async chain (transaction -> payment -> webhook)
- Mocked Provider success

### Missing Coverage Highlights
1. **Authentication:** Missing expired tokens, invalid signatures, malformed API keys, disabled users, duplicate registrations.
2. **Authorization:** Missing exhaustive RBAC per endpoint (e.g., Merchant Member vs Admin), missing default-deny gRPC mTLS tests.
3. **Tenant Isolation:** Missing cross-tenant data access attempts (list/filter/modify).
4. **Payment State Machine:** Missing explicit tests for FAILED, TIMEOUT, UNKNOWN, DECLINED, and optimistic lock failures.
5. **Provider Outcomes:** Missing failure scenarios, amount/currency mismatches, duplicate callbacks.
6. **Kafka & Recovery:** Missing out-of-order events, dead-letter, process crashes post-db-commit.
7. **Ledger:** Missing balancing invariants (total debits == credits) and concurrent idempotent entries.
8. **Reconciliation & Settlement:** Entirely missing from E2E automated scripts.

## Plan
We will systematically construct additional scripts (e.g., `05-auth-exhaustive.sh`, `06-payment-states.sh`, `07-ledger-invariants.sh`, `08-failure-recovery.sh`) to satisfy these requirements.

**Status:** BLOCKED BY BACKEND ISSUES (Pending remaining test implementations)

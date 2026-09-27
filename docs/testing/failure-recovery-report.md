# Failure Recovery Report

## Overview
Tracks systemic resilience to infrastructure failures. A payment gateway must prefer `UNKNOWN` or `PENDING` states over false `FAILED` or false `SUCCESS` during distributed outages.

## Failure Scenarios

1. **Database Outage Post-Commit**
   - **Scenario:** Database goes down right after committing the outbox event, but before Kafka poll.
   - **Expected:** Event remains in `PENDING`. When DB recovers, OutboxRelayWorker picks it up.
   - **Tested:** NO.

2. **Kafka Outage**
   - **Scenario:** Kafka cluster unavailable.
   - **Expected:** Producers fail to write, OutboxRelayWorker backs off. HTTP REST APIs should either queue in outbox (if decoupled) or return appropriate backpressure. No events dropped.
   - **Tested:** NO.

3. **gRPC Provider Service Timeout**
   - **Scenario:** Payment Service calls Provider Service (gRPC), but Provider Service hangs.
   - **Expected:** Payment enters `UNKNOWN` state. No false `FAILED` (provider might have charged the card).
   - **Tested:** NO.

4. **Redis Outage**
   - **Scenario:** Caching/Idempotency layer goes down.
   - **Expected:** Application should ideally degrade gracefully or fail securely (Fail-Closed).
   - **Tested:** NO.

5. **Concurrent Webhook Delivery Failures**
   - **Scenario:** Merchant server returns 503 HTTP for Webhook.
   - **Expected:** Webhook service schedules exponential backoff.
   - **Tested:** NO.

## Required Actions
Create an `08-failure-recovery.sh` test that leverages `docker compose pause` and `docker compose kill` to simulate infrastructure dropping out mid-flight during payment requests, verifying the exact recovery states in the PostgreSQL database.

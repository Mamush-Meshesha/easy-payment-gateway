#!/usr/bin/env bash
# =============================================================================
# 09-failure-recovery.sh
# Phase 15: Failure Recovery & Chaos Engineering Validation
# =============================================================================

set -e

GW="http://localhost:8080"
POSTGRES_CMD="docker exec payment_postgres psql -U postgres -d payment_gateway -t -c"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}✔ PASS${NC}: $1"; }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; exit 1; }
info() { echo -e "${YELLOW}→${NC} $1"; }
sep()  { echo ""; echo "─────────────────────────────────────────────────"; echo "  $1"; echo "─────────────────────────────────────────────────"; }

# =============================================================================
# F1: BOOTSTRAP
# =============================================================================
sep "Bootstrap"

info "Logging in as superadmin..."
ADMIN_TOKEN=$(curl -sf -X POST "$GW/api/v1/auth/login" -d '{"email":"superadmin@gateway.com","password":"password123"}' -H "Content-Type: application/json" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

info "Creating Merchant & API Key..."
TS=$(date +%s)
MERCH_RES=$(curl -sf -X POST "$GW/api/v1/merchants" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"legalName\":\"Chaos\",\"displayName\":\"Chaos\",\"country\":\"US\",\"defaultCurrency\":\"USD\",\"ownerEmail\":\"chaos_$TS@t.com\"}")
MERCH_ID=$(echo "$MERCH_RES" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
KEY_RES=$(curl -sf -X POST "$GW/api/v1/merchants/$MERCH_ID/apikeys" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"key"}')
API_KEY=$(echo "$KEY_RES" | grep -o '"rawKey":"[^"]*' | cut -d'"' -f4)

PROVIDER_ID=$($POSTGRES_CMD "SELECT id FROM providers WHERE status = 'ACTIVE' LIMIT 1;" | tr -d ' \n')

# =============================================================================
# SCENARIO 1: PROVIDER GRPC TIMEOUT (UNKNOWN STATE)
# =============================================================================
sep "SCENARIO 1: Provider gRPC Outage"

info "Pausing provider-service..."
docker compose pause provider-service

info "Initiating payment while provider is down..."
PL_TIMEOUT=$(printf '{"amount":%d,"currency":"USD","providerId":"%s","merchantReference":"ref-chaos-%s-1","paymentMethod":"card"}' 1000 "$PROVIDER_ID" "$TS")
IDEM_KEY="idem-chaos-$TS-1"

# The request should succeed from the client's perspective (202 Accepted) but go into UNKNOWN state internally
RESP=$(curl -s -X POST "$GW/api/v1/payments" -H "Content-Type: application/json" -H "X-API-Key: $API_KEY" -H "Idempotency-Key: $IDEM_KEY" -d "$PL_TIMEOUT")
PAYMENT_ID=$(echo "$RESP" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PAYMENT_ID" ]; then
    fail "Failed to extract Payment ID. Response: $RESP"
fi

STATUS_RES=$(echo "$RESP" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$STATUS_RES" != "UNKNOWN" ]; then
    fail "Expected synchronous response status UNKNOWN, got $STATUS_RES"
fi

DB_STATUS=$($POSTGRES_CMD "SELECT status FROM payments WHERE id = '$PAYMENT_ID';" | tr -d '[:space:]')
if [ "$DB_STATUS" != "UNKNOWN" ]; then
    fail "Expected DB state UNKNOWN, got $DB_STATUS"
fi
pass "Payment safely entered UNKNOWN state when provider gRPC timed out (No silent fallbacks, no false FAILED)."

info "Unpausing provider-service..."
docker compose unpause provider-service

# =============================================================================
# SCENARIO 2: KAFKA OUTAGE (OUTBOX RESILIENCE)
# =============================================================================
sep "SCENARIO 2: Kafka Outage (Outbox Resilience)"

info "Pausing Kafka broker..."
docker pause payment_kafka

info "Initiating payment while Kafka is down..."
PL_KAFKA=$(printf '{"amount":%d,"currency":"USD","providerId":"%s","merchantReference":"ref-chaos-%s-2","paymentMethod":"card"}' 2000 "$PROVIDER_ID" "$TS")
IDEM_KEY_2="idem-chaos-$TS-2"

RESP_KAFKA=$(curl -s -X POST "$GW/api/v1/payments" -H "Content-Type: application/json" -H "X-API-Key: $API_KEY" -H "Idempotency-Key: $IDEM_KEY_2" -d "$PL_KAFKA")
PAYMENT_ID_2=$(echo "$RESP_KAFKA" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PAYMENT_ID_2" ]; then
    fail "Failed to extract Payment ID while Kafka was down. The API should be decoupled via Outbox. Response: $RESP_KAFKA"
fi

DB_STATUS_2=$($POSTGRES_CMD "SELECT status FROM payments WHERE id = '$PAYMENT_ID_2';" | tr -d '[:space:]')
if [ "$DB_STATUS_2" != "PENDING" ]; then
    fail "Expected DB state PENDING, got $DB_STATUS_2"
fi
pass "Payment API successfully accepted intent and stored in PostgreSQL even when Kafka broker was unreachable."

info "Verifying event is queued in Outbox..."
OUTBOX_COUNT=$($POSTGRES_CMD "SELECT count(*) FROM payment_outbox_events WHERE aggregate_id = '$PAYMENT_ID_2' AND status = 'PENDING';" | tr -d '[:space:]')
if [ "$OUTBOX_COUNT" -lt 1 ]; then
    fail "Outbox event was not created for the payment."
fi
pass "Event is safely queued in the PostgreSQL Outbox."

info "Unpausing Kafka broker to allow background relay to resume..."
docker unpause payment_kafka

info "Allowing 10 seconds for Outbox relay to publish to Kafka..."
sleep 10

OUTBOX_COUNT_AFTER=$($POSTGRES_CMD "SELECT count(*) FROM payment_outbox_events WHERE aggregate_id = '$PAYMENT_ID_2' AND status = 'PENDING';" | tr -d '[:space:]')
if [ "$OUTBOX_COUNT_AFTER" -eq 0 ]; then
    pass "Outbox relay successfully published the queued event after Kafka recovered!"
else
    fail "Outbox event is still stuck in PENDING state after Kafka recovered. Relay worker failed."
fi

sep "ALL CHAOS ENGINEERING TESTS PASSED"

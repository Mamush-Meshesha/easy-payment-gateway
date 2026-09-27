#!/bin/bash
set -e

# ===================================================
# PHASE C: PAYMENT STATE MACHINE VALIDATION
# ===================================================

GATEWAY_URL="http://localhost:8080/api/v1"
POSTGRES_CMD="docker exec payment_postgres psql -U postgres -d payment_gateway -t -c"

echo "==================================================="
echo "  PHASE C: PAYMENT STATE MACHINE"
echo "==================================================="

# Setup Admin & Merchant A
TIMESTAMP=$(date +%s)
ADMIN_EMAIL="admin_$TIMESTAMP@example.com"
MERCHANT_EMAIL="merchant_$TIMESTAMP@example.com"

# 1. Admin login
curl -s -X POST "$GATEWAY_URL/auth/register-admin" -H "Content-Type: application/json" -d '{"email": "superadmin@gateway.com", "password": "password123"}' > /dev/null || true
ADMIN_RES=$(curl -s -X POST "$GATEWAY_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"superadmin@gateway.com", "password":"password123"}')
ADMIN_TOKEN=$(echo $ADMIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# 2. Create Merchant
RES_M=$(curl -s -X POST "$GATEWAY_URL/merchants" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"legalName\":\"State Tester\",\"displayName\":\"State Tester\",\"country\":\"ETH\",\"defaultCurrency\":\"ETB\",\"ownerEmail\":\"$MERCHANT_EMAIL\"}")
echo "DEBUG RES_M: $RES_M"
MERCHANT_ID=$(echo $RES_M | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# 3. Create API Key
RES_K=$(curl -s -X POST "$GATEWAY_URL/merchants/$MERCHANT_ID/apikeys" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"Test Key\"}")
echo "DEBUG RES_K: $RES_K"
API_KEY=$(echo $RES_K | grep -o '"rawKey":"[^"]*' | cut -d'"' -f4)

# 4. Get Provider ID
PROVIDERS_LIST=$(curl -s http://localhost:8087/api/v1/providers)
PROVIDER_ID=$(echo $PROVIDERS_LIST | python3 -c 'import sys, json; data=json.load(sys.stdin); print(next((p["id"] for p in data if p["code"]=="telebirr"), ""))')

# ---------------------------------------------------
# Test 1: Validate Success State (Happy Path)
# ---------------------------------------------------
echo "1. Validating SUCCESS State Machine..."
PAYMENT_RES=$(curl -s -X POST "$GATEWAY_URL/payments" \
  -H "X-API-Key: $API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "USD",
    "providerId": "'"$PROVIDER_ID"'",
    "paymentMethod": "MOBILE_MONEY",
    "merchantReference": "ref-'$(uuidgen)'"
  }')
echo "DEBUG PAYMENT_RES: $PAYMENT_RES"
PAYMENT_ID=$(echo $PAYMENT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)


sleep 5 # Allow async processes

# Inject mock provider success
docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF
{"providerId": "$PROVIDER_ID", "providerTransactionId": "tel_$PAYMENT_ID", "paymentId": "$PAYMENT_ID", "status": "SUCCESS", "amount": 1000, "currency": "USD", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF

sleep 5 # Wait for consumer to process

STATE=$($POSTGRES_CMD "SELECT status FROM payments WHERE id = '$PAYMENT_ID';" | tr -d '[:space:]')
if [ "$STATE" != "SUCCEEDED" ]; then
    echo "❌ FAILED: Expected SUCCEEDED, got $STATE"
    exit 1
fi
echo "✅ PASS: SUCCESS state verified."

# ---------------------------------------------------
# Test 2: Validate FAILED State
# ---------------------------------------------------
echo "2. Validating FAILED State Machine..."
PAYMENT_RES_FAIL=$(curl -s -X POST "$GATEWAY_URL/payments" \
  -H "X-API-Key: $API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2000,
    "currency": "USD",
    "providerId": "'"$PROVIDER_ID"'",
    "paymentMethod": "MOBILE_MONEY",
    "merchantReference": "ref-'$(uuidgen)'"
  }')
PAYMENT_ID_FAIL=$(echo $PAYMENT_RES_FAIL | grep -o '"id":"[^"]*' | cut -d'"' -f4)

sleep 5

# Inject mock provider failure
docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF
{"providerId": "$PROVIDER_ID", "providerTransactionId": "tel_$PAYMENT_ID_FAIL", "paymentId": "$PAYMENT_ID_FAIL", "status": "FAILED", "amount": 2000, "currency": "USD", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF

sleep 5

STATE_FAIL=$($POSTGRES_CMD "SELECT status FROM payments WHERE id = '$PAYMENT_ID_FAIL';" | tr -d '[:space:]')
if [ "$STATE_FAIL" != "FAILED" ]; then
    echo "❌ FAILED: Expected FAILED, got $STATE_FAIL"
    exit 1
fi

HISTORY_COUNT=$($POSTGRES_CMD "SELECT count(*) FROM payment_state_histories WHERE payment_id = '$PAYMENT_ID_FAIL';" | tr -d '[:space:]')
if [ "$HISTORY_COUNT" -lt 4 ]; then
    echo "❌ FAILED: Payment state history not correctly appended."
    exit 1
fi
echo "✅ PASS: FAILED state and history append verified."

# ---------------------------------------------------
# Test 3: Validate Duplicate / Late Event Harmlessness
# ---------------------------------------------------
echo "3. Validating Duplicate Event Harmlessness..."
# Re-inject the failure event
docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF
{"providerId": "$PROVIDER_ID", "providerTransactionId": "tel_$PAYMENT_ID_FAIL", "paymentId": "$PAYMENT_ID_FAIL", "status": "FAILED", "amount": 2000, "currency": "USD", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF

sleep 5

NEW_HISTORY_COUNT=$($POSTGRES_CMD "SELECT count(*) FROM payment_state_histories WHERE payment_id = '$PAYMENT_ID_FAIL';" | tr -d '[:space:]')
if [ "$NEW_HISTORY_COUNT" != "$HISTORY_COUNT" ]; then
    echo "❌ FAILED: Duplicate event appended a new history record instead of being idempotent."
    exit 1
fi
echo "✅ PASS: Duplicate event is harmless."

echo "==================================================="
echo "  PHASE C VERIFIED SUCCESSFULLY"
echo "==================================================="

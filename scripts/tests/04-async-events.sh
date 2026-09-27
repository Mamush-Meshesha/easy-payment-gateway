#!/bin/bash
set -e

echo "==================================================="
echo "  PHASE 6: ASYNC EVENT VALIDATION (KAFKA / WEBHOOKS)"
echo "==================================================="

# Ensure services are up
echo "1. Checking Services (Payment, Transaction, Webhook, Provider)..."
curl -s http://localhost:8080/api/v1/admin/system/health > /dev/null || echo "API Gateway reachable"

echo "2. Bootstrapping Merchant & API Key..."
# Ensure admin exists
curl -s -X POST http://localhost:8080/api/v1/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@gateway.com", "password": "password123"}' > /dev/null || true

# Create Merchant
MERCHANT_EMAIL="async-$(uuidgen)@gateway.com"
MERCHANT_RES=$(curl -s -X POST http://localhost:8080/api/v1/merchants \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"superadmin@gateway.com", "password":"password123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)" \
  -H "Content-Type: application/json" \
  -d '{"legalName":"Async Merchant", "displayName":"Async Store", "country":"ETH", "defaultCurrency":"ETB", "ownerEmail":"'"$MERCHANT_EMAIL"'"}')

MERCHANT_ID=$(echo $MERCHANT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Create API Key
API_KEY_RES=$(curl -s -X POST http://localhost:8080/api/v1/merchants/$MERCHANT_ID/apikeys \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"superadmin@gateway.com", "password":"password123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)" \
  -H "Content-Type: application/json" \
  -d '{"name": "async-key"}')

API_KEY=$(echo $API_KEY_RES | grep -o '"rawKey":"[^"]*' | cut -d'"' -f4)

# Get Provider (Telebirr)
PROVIDERS_LIST=$(curl -s http://localhost:8087/api/v1/providers)
PROVIDER_ID=$(echo $PROVIDERS_LIST | python3 -c 'import sys, json; data=json.load(sys.stdin); print(next((p["id"] for p in data if p["code"]=="telebirr"), ""))')

echo "3. Submitting Payment..."
PAYMENT_RES=$(curl -s -X POST http://localhost:8080/api/v1/payments \
  -H "X-API-Key: $API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "ETB",
    "providerId": "'"$PROVIDER_ID"'",
    "customer": {
      "id": "cust_async",
      "phone": "+251911223344"
    },
    "merchantReference": "order-async-1",
    "paymentMethod": "wallet"
  }')

PAYMENT_ID=$(echo $PAYMENT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PAYMENT_ID" ]; then
    echo "❌ FAILED: Could not extract Payment ID. Response: $PAYMENT_RES"
    exit 1
fi
echo "Payment created (ID: $PAYMENT_ID), state should be PENDING."

echo "4. Simulating Provider Webhook via Kafka (provider.normalized.event)..."
# We inject the normalized event directly into Kafka to simulate Provider Service processing a callback
PROVIDER_EVENT='{"paymentId": "'"$PAYMENT_ID"'", "providerId": "'"$PROVIDER_ID"'", "providerTransactionId": "tel_'"$PAYMENT_ID"'", "status": "SUCCESS", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
echo "$PROVIDER_EVENT" | docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event

echo "5. Waiting for Kafka asynchronous propagation (Transaction -> Payment -> Webhook)..."
sleep 6

echo "6. Verifying Transaction State..."
TX_STATE=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "SELECT status FROM transaction.transactions WHERE payment_id = '$PAYMENT_ID';" | tr -d '[:space:]')
if [ "$TX_STATE" != "SUCCESS" ]; then
    echo "❌ FAILED: Transaction state is $TX_STATE, expected SUCCESS. (Did transaction-service consume the event?)"
    exit 1
fi
echo "✅ PASS: Transaction state is SUCCESS."

echo "7. Verifying Payment State Machine..."
PAYMENT_STATE=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "SELECT status FROM payments WHERE id = '$PAYMENT_ID';" | tr -d '[:space:]')
if [ "$PAYMENT_STATE" != "SUCCEEDED" ]; then
    echo "❌ FAILED: Payment state is $PAYMENT_STATE, expected SUCCEEDED. (Did payment-service consume transaction.status.updated?)"
    exit 1
fi
echo "✅ PASS: Payment state is SUCCEEDED."

echo "8. Verifying Webhook Delivery Attempt..."
# The webhook service should have consumed payment.events and created a Delivery record.
DELIVERY_COUNT=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "SELECT count(*) FROM webhook.deliveries WHERE payment_id = '$PAYMENT_ID';" | tr -d '[:space:]')
if [ "$DELIVERY_COUNT" -eq 0 ]; then
    echo "❌ FAILED: No webhook delivery record found. (Did webhook-service consume payment.events?)"
    exit 1
fi
echo "✅ PASS: Webhook Delivery Scheduled."

echo "Phase 6 Async Flow Verified Successfully."

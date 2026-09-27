#!/bin/bash
set -e

echo "Starting Phase 3 Sandbox vs. Live Verification Test..."

AUTH_BASE_URL="http://localhost:3001/api/v1/auth"
MERCHANT_BASE_URL="http://localhost:3002/api/v1/merchants"
PAYMENTS_URL="http://localhost:8084/api/v1/payments"
PROVIDER_SERVICE_URL="http://localhost:8087/api/v1/providers"

# 1. Login as SUPER_ADMIN
echo "Logging in as SUPER_ADMIN..."
LOGIN_RES=$(curl -s -X POST $AUTH_BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@gateway.com",
    "password": "password123"
  }')
TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Trying to register SUPER_ADMIN..."
  curl -s -X POST $AUTH_BASE_URL/register-admin \
    -H "Content-Type: application/json" \
    -d '{
      "email": "superadmin@gateway.com",
      "password": "password123"
    }'
  LOGIN_RES=$(curl -s -X POST $AUTH_BASE_URL/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "superadmin@gateway.com",
      "password": "password123"
    }')
  TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "Failed to retrieve JWT token for SUPER_ADMIN"
  exit 1
fi

# 2. Get/Create Provider
echo "Fetching Provider ID..."
PROVIDERS_LIST=$(curl -s -X GET $PROVIDER_SERVICE_URL)
PROVIDER_ID=$(echo $PROVIDERS_LIST | python3 -c 'import sys, json; data=json.load(sys.stdin); print(next((p["id"] for p in data if p["code"]=="telebirr"), ""))' 2>/dev/null || echo "")

if [ -z "$PROVIDER_ID" ]; then
  echo "Provider not found, creating..."
  PROVIDER_RES=$(curl -s -X POST $PROVIDER_SERVICE_URL \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Telebirr Sandbox",
      "code": "telebirr",
      "type": "MOBILE_MONEY",
      "currency": "ETB",
      "country": "ETH",
      "config": {"url": "https://api.telebirr.sandbox"}
    }')
  PROVIDER_ID=$(echo $PROVIDER_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$PROVIDER_ID" ]; then
  echo "Failed to get Provider ID"
  exit 1
fi

# 3. Create Merchant
echo "Creating merchant..."
MERCHANT_RES=$(curl -s -X POST $MERCHANT_BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Sandbox E2E Merchant",
    "displayName": "Sandbox Store",
    "country": "ETH",
    "defaultCurrency": "ETB",
    "ownerEmail": "sandbox@merchant.com"
  }')
MERCHANT_ID=$(echo $MERCHANT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# 4. Generate TEST API Key
echo "Generating TEST API Key..."
API_KEY_RES=$(curl -s -X POST $MERCHANT_BASE_URL/$MERCHANT_ID/apikeys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "TEST",
    "name": "Sandbox Test Key"
  }')
RAW_API_KEY=$(echo $API_KEY_RES | grep -o '"rawKey":"[^"]*' | cut -d'"' -f4)

# 5. Initiate Payment with TEST API Key
echo "Initiating Payment using TEST API Key..."
PAYMENT_RES=$(curl -s -X POST $PAYMENTS_URL \
  -H "X-API-Key: $RAW_API_KEY" \
  -H "Idempotency-Key: test-idem-$(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "ETB",
    "merchantReference": "sandbox-ref-1",
    "customerId": "cust-sandbox-1",
    "paymentMethod": "TELEBIRR",
    "providerId": "'"$PROVIDER_ID"'"
  }')
echo $PAYMENT_RES
PAYMENT_ID=$(echo $PAYMENT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# 6. Check if the MockProviderAdapter immediately succeeded the payment
sleep 3
echo "Checking Payment Status (Expecting SUCCESS via Mock Adapter)..."

STATUS_RES=$(curl -s -X GET http://localhost:8084/api/v1/checkout/payments/$PAYMENT_ID \
  -H "X-API-Key: $RAW_API_KEY")

STATUS=$(echo $STATUS_RES | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "Final Payment Status: $STATUS"

if [ "$STATUS" == "SUCCEEDED" ]; then
  echo "✅ Sandbox isolation test passed! (Mock Adapter immediately returned SUCCEEDED)"
else
  echo "❌ Sandbox isolation test failed! Status was $STATUS (expected SUCCEEDED)"
  exit 1
fi

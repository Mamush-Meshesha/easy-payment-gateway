#!/bin/bash
set -e

echo "Starting E2E Happy Path Test..."

AUTH_BASE_URL="http://localhost:3001/api/v1/auth"
MERCHANT_BASE_URL="http://localhost:3002/api/v1/merchants"
PAYMENTS_URL="http://localhost:8084/api/v1/payments"

# 1. Register SUPER_ADMIN
echo "Registering SUPER_ADMIN..."
ADMIN_RES=$(curl -s -X POST $AUTH_BASE_URL/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@gateway.com",
    "password": "password123"
  }')
echo $ADMIN_RES

# 2. Login as SUPER_ADMIN
echo "Logging in as SUPER_ADMIN..."
LOGIN_RES=$(curl -s -X POST $AUTH_BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@gateway.com",
    "password": "password123"
  }')
echo $LOGIN_RES
TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to retrieve JWT token for SUPER_ADMIN"
  exit 1
fi

# 3. Create Merchant
echo "Creating merchant..."
MERCHANT_RES=$(curl -s -X POST $MERCHANT_BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "E2E Test Merchant LLC",
    "displayName": "E2E Store",
    "country": "ETH",
    "defaultCurrency": "ETB",
    "ownerEmail": "e2e@merchant.com"
  }')
echo $MERCHANT_RES
MERCHANT_ID=$(echo $MERCHANT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$MERCHANT_ID" ]; then
  echo "Failed to create merchant"
  exit 1
fi

# 4. Generate API Key
echo "Generating API Key..."
API_KEY_RES=$(curl -s -X POST $MERCHANT_BASE_URL/$MERCHANT_ID/apikeys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "production-key"}')
echo $API_KEY_RES
API_KEY=$(echo $API_KEY_RES | grep -o '"rawKey":"[^"]*' | cut -d'"' -f4)

if [ -z "$API_KEY" ]; then
  echo "Failed to generate API Key"
  exit 1
fi

# 5. Create Provider
echo "Creating or Fetching Telebirr provider..."
PROVIDER_RES=$(curl -s -X POST http://localhost:8087/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "code": "telebirr",
    "name": "Telebirr"
  }')

PROVIDER_ID=$(echo $PROVIDER_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROVIDER_ID" ]; then
  # Fetch existing providers
  PROVIDERS_LIST=$(curl -s http://localhost:8087/api/v1/providers)
  PROVIDER_ID=$(echo $PROVIDERS_LIST | python3 -c 'import sys, json; data=json.load(sys.stdin); print(next((p["id"] for p in data if p["code"]=="telebirr"), ""))' 2>/dev/null || echo "")
fi

if [ -z "$PROVIDER_ID" ]; then
  echo "Failed to create or fetch provider"
  exit 1
fi

# 6. Submit Payment
echo "Submitting Payment..."
IDEMPOTENCY_KEY=$(uuidgen)
PAYMENT_RES=$(curl -s -X POST $PAYMENTS_URL \
  -H "X-API-Key: $API_KEY" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "ETB",
    "providerId": "'"$PROVIDER_ID"'",
    "customer": {
      "id": "cust_123",
      "phone": "+251911000000"
    },
    "merchantReference": "order-xyz",
    "paymentMethod": "telebirr-wallet"
  }')
echo $PAYMENT_RES
PAYMENT_ID=$(echo $PAYMENT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PAYMENT_ID" ]; then
  echo "Failed to submit payment"
  exit 1
fi

echo "Payment successfully submitted! E2E script finished."


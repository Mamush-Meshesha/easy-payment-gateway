#!/bin/bash
set -e

echo "Starting Node.js SDK Verification Test..."

AUTH_BASE_URL="http://localhost:3001/api/v1/auth"
MERCHANT_BASE_URL="http://localhost:3002/api/v1/merchants"
PROVIDER_SERVICE_URL="http://localhost:8087/api/v1/providers"

echo "1. Logging in as SUPER_ADMIN..."
LOGIN_RES=$(curl -s -X POST $AUTH_BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@gateway.com",
    "password": "password123"
  }')
TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Check auth-service."
  exit 1
fi

echo "2. Fetching Provider ID..."
PROVIDERS_LIST=$(curl -s -X GET $PROVIDER_SERVICE_URL)
PROVIDER_ID=$(echo $PROVIDERS_LIST | python3 -c 'import sys, json; data=json.load(sys.stdin); print(next((p["id"] for p in data if p["code"]=="telebirr"), ""))' 2>/dev/null || echo "")

if [ -z "$PROVIDER_ID" ]; then
  echo "Failed to get Provider ID"
  exit 1
fi

echo "3. Creating merchant..."
MERCHANT_RES=$(curl -s -X POST $MERCHANT_BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "SDK Node Test Merchant",
    "displayName": "SDK Node Store",
    "country": "ETH",
    "defaultCurrency": "ETB",
    "ownerEmail": "sdknode@merchant.com"
  }')
MERCHANT_ID=$(echo $MERCHANT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo "4. Generating TEST API Key..."
API_KEY_RES=$(curl -s -X POST $MERCHANT_BASE_URL/$MERCHANT_ID/apikeys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "TEST",
    "name": "SDK Node Test Key"
  }')
RAW_API_KEY=$(echo $API_KEY_RES | grep -o '"rawKey":"[^"]*' | cut -d'"' -f4)

if [ -z "$RAW_API_KEY" ]; then
  echo "Failed to generate API Key"
  exit 1
fi

echo "5. Running Node.js SDK E2E test script..."
cd sdks/node
npx tsc examples/quickstart.ts
export API_KEY=$RAW_API_KEY
export PROVIDER_ID=$PROVIDER_ID
node examples/quickstart.js

echo "✅ Node.js SDK Verification Test passed!"

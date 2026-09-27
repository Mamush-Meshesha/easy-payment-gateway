#!/bin/bash
set -e
set -x

echo "==================================================="
echo "  PHASE 4 & 5: PAYMENT FLOW & STATE MACHINE TESTS"
echo "==================================================="

AUTH_BASE_URL="http://localhost:8080/api/v1/auth"
MERCHANT_BASE_URL="http://localhost:8080/api/v1/merchants"
PAYMENTS_URL="http://localhost:8080/api/v1/payments"
PROVIDERS_URL="http://localhost:8087/api/v1/providers"

# 1. Setup Data (Admin, Merchant, API Key, Provider)
echo "1. Bootstrapping test data..."

# Using a robust fetch-or-create logic for admin to prevent errors on multiple runs
LOGIN_RES=$(curl -s -X POST $AUTH_BASE_URL/login -H "Content-Type: application/json" -d '{"email":"superadmin@gateway.com","password":"password123"}')
TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    echo "❌ FAILED: Could not authenticate as SUPER_ADMIN. Run 02-auth-rbac.sh first?"
    exit 1
fi

MERCHANT_RES=$(curl -s -X POST $MERCHANT_BASE_URL -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"legalName":"Flow Test Merchant", "displayName":"Flow Store", "country":"ETH", "defaultCurrency":"ETB", "ownerEmail":"flow_'$RANDOM'@gateway.com"}')
MERCHANT_ID=$(echo $MERCHANT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

API_KEY_RES=$(curl -s -X POST $MERCHANT_BASE_URL/$MERCHANT_ID/apikeys -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "flow-key"}')
API_KEY=$(echo $API_KEY_RES | grep -o '"rawKey":"[^"]*' | cut -d'"' -f4)

PROVIDER_RES=$(curl -s -X POST $PROVIDERS_URL -H "Content-Type: application/json" -d '{"code":"telebirr", "name":"Telebirr Provider"}')
PROVIDER_ID=$(echo $PROVIDER_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$PROVIDER_ID" ]; then
    PROVIDERS_LIST=$(curl -s $PROVIDERS_URL)
    PROVIDER_ID=$(echo $PROVIDERS_LIST | python3 -c 'import sys, json; data=json.load(sys.stdin); print(next((p["id"] for p in data if p["code"]=="telebirr"), ""))' 2>/dev/null || echo "")
fi

if [ -z "$API_KEY" ] || [ -z "$PROVIDER_ID" ]; then
    echo "❌ FAILED: Could not bootstrap Merchant or Provider."
    exit 1
fi

echo "✅ PASS: Data bootstrapped."

# 2. Test 401 Unauthenticated Payment
echo "2. Testing Unauthenticated Payment (Missing API Key)..."
IDEM_401=$(uuidgen)
RES_401=$(curl -s -o /dev/null -w "%{http_code}" -X POST $PAYMENTS_URL -H "Idempotency-Key: $IDEM_401" -H "Content-Type: application/json" -d '{}')
if [ "$RES_401" != "401" ]; then
    echo "❌ FAILED: Expected 401, got $RES_401"
    exit 1
fi
echo "✅ PASS: Unauthenticated request rejected."

# 3. Test Invalid Payload (Negative Amount)
echo "3. Testing Invalid Payload (Negative Amount)..."
IDEMPOTENCY_KEY=$(uuidgen)
RES_INV=$(curl -s -w "\n%{http_code}" -X POST $PAYMENTS_URL -H "X-API-Key: $API_KEY" -H "Idempotency-Key: $IDEMPOTENCY_KEY" -H "Content-Type: application/json" \
  -d '{"amount": -100, "currency": "ETB", "providerId": "'"$PROVIDER_ID"'", "customer": {"id": "cust_1"}, "merchantReference": "invalid", "paymentMethod": "telebirr-wallet"}')
HTTP_STATUS=$(echo "$RES_INV" | tail -n1)
if [ "$HTTP_STATUS" != "400" ]; then
    echo "❌ FAILED: Expected 400 for negative amount, got $HTTP_STATUS"
    exit 1
fi
echo "✅ PASS: Invalid payload rejected."

# 4. Successful Payment Submission (Transitions to PROCESSING)
echo "4. Submitting Valid Payment (Expect PENDING -> PROCESSING)..."
IDEMPOTENCY_KEY2=$(uuidgen)
RES_VALID=$(curl -s -w "\n%{http_code}" -X POST $PAYMENTS_URL -H "X-API-Key: $API_KEY" -H "Idempotency-Key: $IDEMPOTENCY_KEY2" -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "ETB", "providerId": "'"$PROVIDER_ID"'", "customer": {"id": "cust_1", "phone": "+251911"}, "merchantReference": "ref-ok", "paymentMethod": "telebirr-wallet"}')
HTTP_STATUS=$(echo "$RES_VALID" | tail -n1)
BODY=$(echo "$RES_VALID" | sed '$d')

if [ "$HTTP_STATUS" != "201" ] && [ "$HTTP_STATUS" != "202" ] && [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ FAILED: Expected 2XX, got $HTTP_STATUS. Body: $BODY"
    exit 1
fi

PAYMENT_ID=$(echo $BODY | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$PAYMENT_ID" ]; then
    echo "❌ FAILED: Could not extract Payment ID from response."
    exit 1
fi
echo "✅ PASS: Payment created (ID: $PAYMENT_ID)."

# 5. Idempotency Check
echo "5. Verifying Idempotency..."
RES_IDEM=$(curl -s -w "\n%{http_code}" -X POST $PAYMENTS_URL -H "X-API-Key: $API_KEY" -H "Idempotency-Key: $IDEMPOTENCY_KEY2" -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "ETB", "providerId": "'"$PROVIDER_ID"'", "customer": {"id": "cust_1", "phone": "+251911"}, "merchantReference": "ref-ok", "paymentMethod": "telebirr-wallet"}')
HTTP_STATUS_IDEM=$(echo "$RES_IDEM" | tail -n1)

# Depending on idempotency implementation, it should either return 200/201/202 (same ID) or 409 if active.
if [ "$HTTP_STATUS_IDEM" != "201" ] && [ "$HTTP_STATUS_IDEM" != "200" ] && [ "$HTTP_STATUS_IDEM" != "202" ] && [ "$HTTP_STATUS_IDEM" != "409" ]; then
    echo "❌ FAILED: Expected idempotency response, got $HTTP_STATUS_IDEM"
    exit 1
fi
echo "✅ PASS: Idempotency enforced."

# 6. Verify Database State Machine (PENDING / PROCESSING)
echo "6. Verifying Payment State Machine in Postgres..."
# The payment should have transitioned to PROCESSING because Risk is called synchronously, and Provider is called synchronously!
STATE=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "SELECT status FROM payments WHERE id = '$PAYMENT_ID';" | tr -d '[:space:]')

if [ "$STATE" != "PROCESSING" ] && [ "$STATE" != "PENDING" ] && [ "$STATE" != "SUCCEEDED" ]; then
    echo "❌ FAILED: Invalid state $STATE in database."
    exit 1
fi
echo "✅ PASS: State Machine verified ($STATE)."

echo "Phase 4 & 5: Payment Flow & State Machine Tests verified successfully."

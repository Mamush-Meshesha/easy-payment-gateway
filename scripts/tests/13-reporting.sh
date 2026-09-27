#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}─────────────────────────────────────────────────"
echo -e "  Phase 17.3 Reporting E2E"
echo -e "─────────────────────────────────────────────────${NC}"

RUN_ID=$RANDOM
GW="http://localhost:8080"
API_URL="$GW/api/v1"
AUTH_URL="$GW/api/v1/auth"

extract() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)" 2>/dev/null || echo ""; }

# 1. Login
LOGIN_RESP=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gateway.com","password":"password123"}')

ADMIN_TOKEN=$(extract "$LOGIN_RESP" "['accessToken']")
if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ FAILED: Could not login as superadmin${NC}"
    exit 1
fi
echo -e "${GREEN}→ Superadmin authenticated${NC}"

# 2. Create Merchant
MERCHANT_EMAIL="report$RUN_ID@gateway.local"
MERCHANT_RESP=$(curl -s -X POST "$API_URL/merchants" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"legalName\":\"ReportStore\",\"displayName\":\"Report Store\",\"country\":\"ETH\",\"defaultCurrency\":\"ETB\",\"ownerEmail\":\"$MERCHANT_EMAIL\"}")

MERCHANT_ID=$(extract "$MERCHANT_RESP" "['id']")
echo -e "${GREEN}→ Merchant: $MERCHANT_ID${NC}"

sleep 2
docker exec payment_postgres psql -U postgres -d payment_gateway -c "UPDATE \"Credential\" SET \"passwordHash\" = (SELECT \"passwordHash\" FROM \"Credential\" c JOIN \"User\" u ON u.id = c.\"userId\" WHERE u.email = 'superadmin@gateway.com') WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = '$MERCHANT_EMAIL');" > /dev/null 2>&1

MERCHANT_LOGIN=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MERCHANT_EMAIL\",\"password\":\"password123\"}")

MERCHANT_TOKEN=$(extract "$MERCHANT_LOGIN" "['accessToken']")

# 3. Generate API Key
APIKEY_RESP=$(curl -s -X POST "$API_URL/merchants/$MERCHANT_ID/apikeys" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Production Key\"}")

API_KEY=$(extract "$APIKEY_RESP" "['rawKey']")

# 4. Get Provider ID
PROVIDER_RESP=$(curl -s -X GET "http://localhost:8087/api/v1/providers" -H "Authorization: Bearer $ADMIN_TOKEN")
PROVIDER_ID=$(echo "$PROVIDER_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null || echo "")

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ R1: Generating Payments for Projection${NC}"

for i in {1..3}; do
  PAY=$(curl -s -X POST "$API_URL/payments" \
    -H "x-api-key: $API_KEY" \
    -H "Idempotency-Key: report-$RUN_ID-$i" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": $((1000 * i)),
      \"currency\": \"ETB\",
      \"providerId\": \"$PROVIDER_ID\",
      \"paymentMethod\": \"TELEBIRR\",
      \"merchantReference\": \"order-$RUN_ID-$i\"
    }")
  PAY_ID=$(extract "$PAY" "['id']")
  
  # Trigger Provider Webhook Event
  docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF > /dev/null 2>&1
  {"providerId": "$PROVIDER_ID", "providerTransactionId": "ptx-report-$RUN_ID-$i", "paymentId": "$PAY_ID", "status": "SUCCESS", "amount": $((1000 * i)), "currency": "ETB", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF
done

echo "Waiting for payment events to be processed and projected..."
sleep 15

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ R2: Testing Paginated Read API${NC}"

# Wait for Nginx routing...
REPORT_API_URL="$GW/api/v1/reporting"

# Fetch payments
REPORT_RESP=$(curl -s -X GET "$REPORT_API_URL/payments?limit=2" \
  -H "Authorization: Bearer $MERCHANT_TOKEN")

COUNT=$(echo "$REPORT_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data', [])))" 2>/dev/null)
HAS_MORE=$(echo "$REPORT_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pagination', {}).get('hasMore', 'false'))" 2>/dev/null)

if [ "$COUNT" -eq 2 ] && [ "$HAS_MORE" == "True" ]; then
    echo -e "${GREEN}✅ PASS: Read API correctly paginated and returned projections${NC}"
else
    echo -e "${RED}❌ FAILED: Expected 2 items with hasMore=True. Got count=$COUNT, hasMore=$HAS_MORE${NC}"
    echo "Response: $REPORT_RESP"
    exit 1
fi

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ R3: Testing CSV Export${NC}"

CSV_RESP=$(curl -s -X GET "$REPORT_API_URL/payments/export.csv" \
  -H "Authorization: Bearer $MERCHANT_TOKEN")

CSV_LINES=$(echo "$CSV_RESP" | wc -l)

# Header + 3 payments = 4 lines
if [ "$CSV_LINES" -ge 4 ]; then
    echo -e "${GREEN}✅ PASS: CSV Export generated correctly with $CSV_LINES lines${NC}"
else
    echo -e "${RED}❌ FAILED: Expected at least 4 lines in CSV, got $CSV_LINES${NC}"
    echo "CSV Output:"
    echo "$CSV_RESP"
    exit 1
fi

echo -e "\n${GREEN}  ✅ ALL REPORTING CHECKS PASSED${NC}"

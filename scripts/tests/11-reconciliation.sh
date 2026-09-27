#!/bin/bash


# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}─────────────────────────────────────────────────"
echo -e "  Phase 17.1 Reconciliation E2E"
echo -e "─────────────────────────────────────────────────${NC}"

# Configuration
RUN_ID=$RANDOM
GW="http://localhost:8080"
API_URL="$GW/api/v1"
AUTH_URL="$GW/api/v1/auth"
RECON_URL="http://localhost:3015/api/v1/reconciliation"

# Helpers
extract()   { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)" 2>/dev/null || echo ""; }

# 1. Bootstrap Admin
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
MERCHANT_SUFFIX=$RANDOM
MERCHANT_NAME="ReconMerchant_$MERCHANT_SUFFIX"
MERCHANT_RESP=$(curl -s -X POST "$API_URL/merchants" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"legalName\":\"$MERCHANT_NAME\",\"displayName\":\"E2E Store\",\"country\":\"ETH\",\"defaultCurrency\":\"ETB\",\"ownerEmail\":\"recon$MERCHANT_SUFFIX@gateway.local\"}")

MERCHANT_ID=$(extract "$MERCHANT_RESP" "['id']")
echo -e "${GREEN}→ Merchant: $MERCHANT_ID${NC}"

sleep 2 # wait for async user creation
docker exec payment_postgres psql -U postgres -d payment_gateway -c "UPDATE \"Credential\" SET \"passwordHash\" = (SELECT \"passwordHash\" FROM \"Credential\" c JOIN \"User\" u ON u.id = c.\"userId\" WHERE u.email = 'superadmin@gateway.com') WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = 'recon$MERCHANT_SUFFIX@gateway.local');" > /dev/null 2>&1

MERCHANT_LOGIN=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"recon$MERCHANT_SUFFIX@gateway.local\",\"password\":\"password123\"}")

MERCHANT_TOKEN=$(extract "$MERCHANT_LOGIN" "['accessToken']")

# 4. Generate API Key
APIKEY_RESP=$(curl -s -X POST "$API_URL/merchants/$MERCHANT_ID/apikeys" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Production Key\"}")

echo "APIKEY_RESP: $APIKEY_RESP"
API_KEY=$(extract "$APIKEY_RESP" "['rawKey']")

# 5. Get Provider ID
PROVIDER_RESP=$(curl -s -X GET "http://localhost:8087/api/v1/providers" -H "Authorization: Bearer $ADMIN_TOKEN")
PROVIDER_ID=$(echo "$PROVIDER_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null || echo "")

if [ -z "$PROVIDER_ID" ]; then
    echo -e "${RED}❌ FAILED: Could not fetch Provider${NC}"
    exit 1
fi
echo -e "${GREEN}→ Provider: $PROVIDER_ID${NC}"

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ R1: Setting up exact matching payment (100.00 ETB)${NC}"
PAY_EXACT=$(curl -s -X POST "$API_URL/payments" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: recon-exact-$RUN_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 10000,
    \"currency\": \"ETB\",
    \"providerId\": \"$PROVIDER_ID\",
    \"paymentMethod\": \"TELEBIRR\",
    \"merchantReference\": \"order-exact-$RUN_ID\",
    \"metadata\": {\"customerPhone\":\"+251911000000\"}
  }")
echo "PAY_EXACT Response: $PAY_EXACT"
PAY_EXACT_ID=$(extract "$PAY_EXACT" "['id']")
docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF > /dev/null 2>&1
{"providerId": "$PROVIDER_ID", "providerTransactionId": "ptx-exact-$RUN_ID", "paymentId": "$PAY_EXACT_ID", "status": "SUCCESS", "amount": 10000, "currency": "ETB", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF
echo -e "${GREEN}✅ PASS: Exact payment setup complete${NC}"


echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ R2: Setting up amount mismatch payment (Real: 200.00 ETB, CSV will say 150.00 ETB)${NC}"
PAY_AMT=$(curl -s -X POST "$API_URL/payments" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: recon-amt-$RUN_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 20000,
    \"currency\": \"ETB\",
    \"providerId\": \"$PROVIDER_ID\",
    \"paymentMethod\": \"TELEBIRR\",
    \"merchantReference\": \"order-amt-$RUN_ID\",
    \"metadata\": {\"customerPhone\":\"+251911000000\"}
  }")
echo "PAY_AMT Response: $PAY_AMT"
PAY_AMT_ID=$(extract "$PAY_AMT" "['id']")
docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF > /dev/null 2>&1
{"providerId": "$PROVIDER_ID", "providerTransactionId": "ptx-amt-$RUN_ID", "paymentId": "$PAY_AMT_ID", "status": "SUCCESS", "amount": 20000, "currency": "ETB", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF
echo -e "${GREEN}✅ PASS: Amount mismatch payment setup complete${NC}"

sleep 2

# Create CSV file
CSV_FILE="/tmp/recon_statement_$RANDOM.csv"
cat << EOF > $CSV_FILE
provider_transaction_id,amount,currency,status
ptx-exact-$RUN_ID,10000,ETB,SUCCEEDED
ptx-amt-$RUN_ID,15000,ETB,SUCCEEDED
ptx-missing-$RUN_ID,50000,ETB,SUCCEEDED
EOF

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ R3: Uploading CSV Statement${NC}"
UPLOAD_RESP=$(curl -s -X POST "$RECON_URL/upload" \
  -F "provider_id=$PROVIDER_ID" \
  -F "file=@$CSV_FILE")

JOB_ID=$(extract "$UPLOAD_RESP" "['job_id']")
if [ -z "$JOB_ID" ]; then
    echo -e "${RED}❌ FAILED: Upload failed. Response: $UPLOAD_RESP${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PASS: Statement uploaded, Job ID: $JOB_ID${NC}"

# Wait for background job to finish
sleep 3

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ R4: Verifying Exceptions in Database${NC}"

# Check for AMOUNT_MISMATCH
AMT_MISMATCH=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "SELECT count(*) FROM reconciliation_exceptions WHERE exception_type = 'AMOUNT_MISMATCH' AND provider_transaction_id = 'ptx-amt-$RUN_ID';" | tr -d ' ')
if [ "$AMT_MISMATCH" -eq "1" ]; then
    echo -e "${GREEN}✅ PASS: AMOUNT_MISMATCH correctly identified${NC}"
else
    echo -e "${RED}❌ FAILED: AMOUNT_MISMATCH not found${NC}"
    exit 1
fi

# Check for MISSING_IN_LEDGER
MISSING=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "SELECT count(*) FROM reconciliation_exceptions WHERE exception_type = 'MISSING_IN_LEDGER' AND provider_transaction_id = 'ptx-missing-$RUN_ID';" | tr -d ' ')
if [ "$MISSING" -eq "1" ]; then
    echo -e "${GREEN}✅ PASS: MISSING_IN_LEDGER correctly identified${NC}"
else
    echo -e "${RED}❌ FAILED: MISSING_IN_LEDGER not found${NC}"
    exit 1
fi

echo -e "\n${GREEN}  ✅ ALL RECONCILIATION CHECKS PASSED${NC}\n"

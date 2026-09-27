#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}─────────────────────────────────────────────────"
echo -e "  Phase 17.2 Notification E2E"
echo -e "─────────────────────────────────────────────────${NC}"

RUN_ID=$RANDOM
GW="http://localhost:8080"
API_URL="$GW/api/v1"
AUTH_URL="$GW/api/v1/auth"

extract() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)" 2>/dev/null || echo ""; }

# 1. Clear MailHog
curl -s -X DELETE "http://localhost:8025/api/v1/messages" > /dev/null
echo -e "${GREEN}→ MailHog cleared${NC}"

# 2. Login
LOGIN_RESP=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gateway.com","password":"password123"}')

ADMIN_TOKEN=$(extract "$LOGIN_RESP" "['accessToken']")
if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ FAILED: Could not login as superadmin${NC}"
    exit 1
fi
echo -e "${GREEN}→ Superadmin authenticated${NC}"

# 3. Create Merchant
MERCHANT_EMAIL="notify$RUN_ID@gateway.local"
MERCHANT_RESP=$(curl -s -X POST "$API_URL/merchants" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"legalName\":\"NotifyStore\",\"displayName\":\"E2E Store\",\"country\":\"ETH\",\"defaultCurrency\":\"ETB\",\"ownerEmail\":\"$MERCHANT_EMAIL\"}")

MERCHANT_ID=$(extract "$MERCHANT_RESP" "['id']")
echo -e "${GREEN}→ Merchant: $MERCHANT_ID${NC}"

sleep 2
docker exec payment_postgres psql -U postgres -d payment_gateway -c "UPDATE \"Credential\" SET \"passwordHash\" = (SELECT \"passwordHash\" FROM \"Credential\" c JOIN \"User\" u ON u.id = c.\"userId\" WHERE u.email = 'superadmin@gateway.com') WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = '$MERCHANT_EMAIL');" > /dev/null 2>&1

MERCHANT_LOGIN=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MERCHANT_EMAIL\",\"password\":\"password123\"}")

MERCHANT_TOKEN=$(extract "$MERCHANT_LOGIN" "['accessToken']")

# 4. Generate API Key
APIKEY_RESP=$(curl -s -X POST "$API_URL/merchants/$MERCHANT_ID/apikeys" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Production Key\"}")

API_KEY=$(extract "$APIKEY_RESP" "['rawKey']")

# 5. Get Provider ID
PROVIDER_RESP=$(curl -s -X GET "http://localhost:8087/api/v1/providers" -H "Authorization: Bearer $ADMIN_TOKEN")
PROVIDER_ID=$(echo "$PROVIDER_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null || echo "")

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ N1: Successful Payment Notification${NC}"
PAY_1=$(curl -s -X POST "$API_URL/payments" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: notify-$RUN_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 15000,
    \"currency\": \"ETB\",
    \"providerId\": \"$PROVIDER_ID\",
    \"paymentMethod\": \"TELEBIRR\",
    \"merchantReference\": \"order-$RUN_ID\",
    \"metadata\": {\"customerPhone\":\"+251911000000\"}
  }")
PAY_1_ID=$(extract "$PAY_1" "['id']")

# Trigger Provider Webhook Event
docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF > /dev/null 2>&1
{"providerId": "$PROVIDER_ID", "providerTransactionId": "ptx-notif-$RUN_ID", "paymentId": "$PAY_1_ID", "status": "SUCCESS", "amount": 15000, "currency": "ETB", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF

echo "Waiting for notification dispatch..."
sleep 15

MESSAGES=$(curl -s "http://localhost:8025/api/v2/messages")
COUNT=$(echo "$MESSAGES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total', 0))" 2>/dev/null)

if [ "$COUNT" -ge 1 ]; then
    echo -e "${GREEN}✅ PASS: MailHog received the payment notification${NC}"
else
    echo -e "${RED}❌ FAILED: MailHog did not receive the email. Count: $COUNT${NC}"
    exit 1
fi

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ N2: Provider Failure & Retry Wait state${NC}"
docker compose stop mailhog
echo "Mailhog stopped."

PAY_2=$(curl -s -X POST "$API_URL/payments" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: notify-fail-$RUN_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 25000,
    \"currency\": \"ETB\",
    \"providerId\": \"$PROVIDER_ID\",
    \"paymentMethod\": \"TELEBIRR\",
    \"merchantReference\": \"order-fail-$RUN_ID\"
  }")
PAY_2_ID=$(extract "$PAY_2" "['id']")
echo "DEBUG PAY_2: $PAY_2"
echo "DEBUG PAY_2_ID: $PAY_2_ID"

if [ -z "$PAY_2_ID" ]; then
    echo -e "${RED}❌ FAILED: PAY_2_ID is empty${NC}"
    docker compose start mailhog
    exit 1
fi

docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event <<EOF > /dev/null 2>&1
{"providerId": "$PROVIDER_ID", "providerTransactionId": "ptx-notif2-$RUN_ID", "paymentId": "$PAY_2_ID", "status": "SUCCESS", "amount": 25000, "currency": "ETB", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF

echo "Waiting for notification dispatch to fail and retry..."
# Poll for RETRY_WAIT (up to 30s)
STATUS=""
for i in {1..15}; do
  STATUS=$(docker exec payment_postgres psql -U postgres -d notification_db -t -c "SELECT status FROM notification_logs WHERE event_id = '$PAY_2_ID:SUCCEEDED' LIMIT 1;" | xargs)
  if [ "$STATUS" == "RETRY_WAIT" ]; then
    break
  fi
  sleep 2
done

if [ "$STATUS" == "RETRY_WAIT" ]; then
    echo -e "${GREEN}✅ PASS: Notification entered RETRY_WAIT due to SMTP failure${NC}"
else
    echo -e "${RED}❌ FAILED: Expected RETRY_WAIT, got $STATUS${NC}"
    docker compose start mailhog
    exit 1
fi

echo -e "\n${CYAN}─────────────────────────────────────────────────"
echo -e "→ N3: Recovery after Retry${NC}"
docker compose start mailhog
echo "Mailhog started. Waiting for retry worker (interval ~5s, plus exponential backoff)..."
# Poll for SENT (up to 40s)
STATUS_AFTER=""
for i in {1..20}; do
  STATUS_AFTER=$(docker exec payment_postgres psql -U postgres -d notification_db -t -c "SELECT status FROM notification_logs WHERE event_id = '$PAY_2_ID:SUCCEEDED' LIMIT 1;" | xargs)
  if [ "$STATUS_AFTER" == "SENT" ]; then
    break
  fi
  sleep 2
done

if [ "$STATUS_AFTER" == "SENT" ]; then
    echo -e "${GREEN}✅ PASS: Notification successfully recovered and SENT${NC}"
else
    echo -e "${RED}❌ FAILED: Expected SENT, got $STATUS_AFTER${NC}"
    exit 1
fi

echo -e "\n${GREEN}  ✅ ALL NOTIFICATION CHECKS PASSED${NC}"

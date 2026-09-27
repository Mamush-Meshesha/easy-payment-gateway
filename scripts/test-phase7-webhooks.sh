#!/bin/bash
set -e

echo "============================================="
echo " Phase 7: Webhook Delivery Integration Test"
echo "============================================="

MERCHANT_ID="4352161e-b8dd-4d6f-b182-d9462374afe2"
API_KEY="sk_test_1234567890abcdef"
WEBHOOK_PORT=9999
DB_URI="postgres://postgres:postgres@localhost:5433/payment_gateway?sslmode=disable"

echo "1. Checking if dummy webhook receiver is running..."
if ! lsof -i:$WEBHOOK_PORT > /dev/null; then
  echo "   Starting dummy webhook receiver on port $WEBHOOK_PORT in background..."
  cat << 'EOF' > dummy-webhook.js
const http = require('http');
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    console.log('\n--- WEBHOOK RECEIVED ---');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', body);
    console.log('------------------------\n');
    res.writeHead(200);
    res.end('OK');
  });
});
server.listen(9999, () => console.log('Dummy webhook server running on :9999'));
EOF
  node dummy-webhook.js &
  DUMMY_PID=$!
  sleep 2
else
  echo "   Dummy webhook receiver is already running on port $WEBHOOK_PORT."
fi

echo "2. Setting up Merchant Webhook Config in Database..."
# Delete existing test config if any
psql $DB_URI -c "DELETE FROM \"WebhookConfig\" WHERE \"merchantId\" = '$MERCHANT_ID';"
# Insert new config
psql $DB_URI -c "INSERT INTO \"WebhookConfig\" (id, \"merchantId\", environment, url, \"secretHash\", \"isActive\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), '$MERCHANT_ID', 'TEST', 'http://localhost:9999/webhook', 'test_secret_for_hmac', true, NOW(), NOW());"

echo "3. Triggering a Payment via API to fire the webhook..."
RESPONSE=$(curl -s -X POST http://localhost:3000/v1/payments \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "currency": "ETB",
    "paymentMethod": "TELEBIRR",
    "returnUrl": "http://localhost:3000/return"
  }')

echo "Response from API: $RESPONSE"

PAYMENT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$PAYMENT_ID" ] || [ "$PAYMENT_ID" == "null" ]; then
  echo "Failed to create payment!"
  if [ -n "$DUMMY_PID" ]; then kill $DUMMY_PID; fi
  exit 1
fi
echo "Payment created with ID: $PAYMENT_ID"

echo "4. Simulating Provider Success Callback to trigger state change..."
sleep 1
curl -s -X POST http://localhost:3000/v1/internal/provider-callback \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "telebirr-test",
    "providerReference": "TX-123456",
    "paymentId": "'$PAYMENT_ID'",
    "status": "SUCCEEDED"
  }'

echo "Callback simulated."

echo "5. Waiting for Webhook Delivery..."
echo "Watch the dummy webhook server output above. It should receive the event."
sleep 5

echo "Test completed."
if [ -n "$DUMMY_PID" ]; then
  echo "Killing dummy webhook server..."
  kill $DUMMY_PID
fi

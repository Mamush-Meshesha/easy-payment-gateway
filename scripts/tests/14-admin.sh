#!/usr/bin/env bash
set -e

source ./scripts/tests/common.sh

print_header "Phase 17.4 Admin E2E"

ADMIN_EMAIL="superadmin@gateway.com"
ADMIN_PW="SuperP@ss123!"

log_step "Authenticating as Super Admin"
ADMIN_LOGIN_RESP=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PW\"}")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESP | jq -r '.accessToken')
if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  fail "Failed to get admin token: $ADMIN_LOGIN_RESP"
fi
success "Superadmin authenticated"

# Wait a moment for services to be ready
sleep 1

log_step "A1: Testing Super Admin RBAC (List Merchants)"
LIST_RESP=$(curl -s -X GET "$API_URL/admin/merchants?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

TOTAL=$(echo $LIST_RESP | jq -r '.total')
if [ "$TOTAL" == "null" ] || [ -z "$TOTAL" ]; then
  fail "Failed to list merchants: $LIST_RESP"
fi
success "Listed merchants successfully. Total: $TOTAL"

MERCHANT_ID=$(echo $LIST_RESP | jq -r '.merchants[0].id')
if [ "$MERCHANT_ID" == "null" ] || [ -z "$MERCHANT_ID" ]; then
  fail "No merchants found to test suspension. Run previous tests first."
fi

log_step "A2: Testing Merchant Suspension"
SUSPEND_RESP=$(curl -s -X PATCH "$API_URL/admin/merchants/$MERCHANT_ID/suspend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"reason\":\"Suspicious activity detected\"}")

STATUS=$(echo $SUSPEND_RESP | jq -r '.status')
if [ "$STATUS" != "SUSPENDED" ]; then
  fail "Merchant suspension failed: $SUSPEND_RESP"
fi
success "Merchant suspended successfully"

log_step "A3: Testing Configuration Overrides (Limits)"
LIMIT_RESP=$(curl -s -X PUT "$API_URL/admin/merchants/$MERCHANT_ID/limit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currency\":\"ETB\",\"minAmount\":100,\"maxAmount\":5000000}")

SUCCESS=$(echo $LIMIT_RESP | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  fail "Configuration override failed: $LIMIT_RESP"
fi
success "Configuration overrides applied successfully"

log_step "A4: Testing Merchant Cannot Access Admin API"
# Create a dummy merchant token by registering one
MERCHANT_EMAIL="rogue-$RANDOM@gateway.com"
MERCHANT_RESP=$(curl -s -X POST "$API_URL/merchants" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"legalName\":\"RogueStore\",\"displayName\":\"Rogue Store\",\"country\":\"ETH\",\"defaultCurrency\":\"ETB\",\"ownerEmail\":\"$MERCHANT_EMAIL\"}")

# Force the database to bypass email verification and set a password directly
docker exec payment_postgres psql -U postgres -d payment_gateway -c "UPDATE \"Credential\" SET \"passwordHash\" = (SELECT \"passwordHash\" FROM \"Credential\" c JOIN \"User\" u ON u.id = c.\"userId\" WHERE u.email = 'superadmin@gateway.com') WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = '$MERCHANT_EMAIL');" > /dev/null 2>&1

MERCHANT_LOGIN_RESP=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MERCHANT_EMAIL\",\"password\":\"$ADMIN_PW\"}")

MERCHANT_TOKEN=$(echo $MERCHANT_LOGIN_RESP | jq -r '.accessToken')
if [ "$MERCHANT_TOKEN" == "null" ] || [ -z "$MERCHANT_TOKEN" ]; then
  fail "Failed to get rogue merchant token"
fi

ROGUE_RESP=$(curl -s -X GET "$API_URL/admin/merchants" \
  -w "%{http_code}" -o /dev/null \
  -H "Authorization: Bearer $MERCHANT_TOKEN")

if [ "$ROGUE_RESP" != "403" ]; then
  fail "Expected 403 Forbidden, got $ROGUE_RESP"
fi
success "Merchant correctly blocked from accessing Admin API"

echo -e "\n  ✅ ALL ADMIN CHECKS PASSED\n"

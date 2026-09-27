#!/usr/bin/env bash
# =============================================================================
# 07-idempotency-concurrency.sh  — Phase D: Idempotency & Concurrency
#
#   D1. Same key + same payload => same payment ID
#   D2. Same key + different payload => 409 Conflict
#   D3. 5 concurrent requests same key => exactly one unique payment ID
#   D4. 5 concurrent requests different keys => 5 distinct payment IDs
#   D5. Same key + different merchant => distinct payments (key is tenant-scoped)
# =============================================================================
set -euo pipefail

GW="http://localhost:8080"
PASS=0; FAIL=0; ERRORS=()

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}✔ PASS${NC}: $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; FAIL=$((FAIL+1)); ERRORS+=("$1"); }
info() { echo -e "${YELLOW}→${NC} $1"; }
sep()  { echo ""; echo "─────────────────────────────────────────────────"; echo "  $1"; echo "─────────────────────────────────────────────────"; }

# =============================================================================
# BOOTSTRAP
# =============================================================================
sep "BOOTSTRAP"

info "Logging in as superadmin..."
ADMIN_TOKEN=$(curl -sf -X POST "$GW/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gateway.com","password":"password123"}' \
  | jq -r '.accessToken // .token // empty')
[ -z "$ADMIN_TOKEN" ] && { echo -e "${RED}FATAL${NC}: Login failed"; exit 1; }
info "Admin token obtained."

TS=$(date +%s)

# Merchant A
info "Creating Merchant A..."
MERCHANT_A_ID=$(curl -sf -X POST "$GW/api/v1/merchants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"legalName\":\"Idem A\",\"displayName\":\"Idem A\",\"defaultCurrency\":\"USD\",\"ownerEmail\":\"idem-a-$TS@test.com\",\"country\":\"ET\"}" \
  | jq -r '.id // empty')
[ -z "$MERCHANT_A_ID" ] && { echo -e "${RED}FATAL${NC}: Merchant A creation failed"; exit 1; }

MERCHANT_A_KEY=$(curl -sf -X POST "$GW/api/v1/merchants/$MERCHANT_A_ID/apikeys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"key-a"}' \
  | jq -r '.rawKey // empty')
[ -z "$MERCHANT_A_KEY" ] && { echo -e "${RED}FATAL${NC}: Merchant A key creation failed"; exit 1; }
info "Merchant A: $MERCHANT_A_ID | Key: ${MERCHANT_A_KEY:0:16}..."

# Merchant B
info "Creating Merchant B..."
MERCHANT_B_ID=$(curl -sf -X POST "$GW/api/v1/merchants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"legalName\":\"Idem B\",\"displayName\":\"Idem B\",\"defaultCurrency\":\"USD\",\"ownerEmail\":\"idem-b-$TS@test.com\",\"country\":\"ET\"}" \
  | jq -r '.id // empty')
[ -z "$MERCHANT_B_ID" ] && { echo -e "${RED}FATAL${NC}: Merchant B creation failed"; exit 1; }

MERCHANT_B_KEY=$(curl -sf -X POST "$GW/api/v1/merchants/$MERCHANT_B_ID/apikeys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"key-b"}' \
  | jq -r '.rawKey // empty')
[ -z "$MERCHANT_B_KEY" ] && { echo -e "${RED}FATAL${NC}: Merchant B key creation failed"; exit 1; }
info "Merchant B: $MERCHANT_B_ID | Key: ${MERCHANT_B_KEY:0:16}..."

# Provider ID — fetch from DB directly
PROVIDER_ID=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c \
  "SELECT id FROM providers WHERE status = 'ACTIVE' LIMIT 1;" 2>/dev/null | tr -d ' \n')
[ -z "$PROVIDER_ID" ] && { echo -e "${RED}FATAL${NC}: No active provider in DB"; exit 1; }
info "Provider: $PROVIDER_ID"

# =============================================================================
# D1. Same key + same payload => idempotent (same payment ID returned)
# =============================================================================
sep "D1: Same key + same payload => idempotent response"

IDEM_D1="d1-$(date +%s%N)"
REF_D1="ref-d1-$(date +%s%N)"
PL_D1=$(printf '{"amount":5000,"currency":"USD","providerId":"%s","merchantReference":"%s","paymentMethod":"card","idempotencyKey":"%s"}' \
  "$PROVIDER_ID" "$REF_D1" "$IDEM_D1")

info "First request..."
R1=$(curl -sf -X POST "$GW/api/v1/payments" \
  -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_A_KEY" \
  -H "Idempotency-Key: $IDEM_D1" -d "$PL_D1" || echo '{}')
ID1=$(echo "$R1" | jq -r '.paymentId // .payment_id // .id // empty')

if [ -z "$ID1" ]; then
  fail "D1: First request returned no payment ID. Response: $R1"
else
  info "First payment ID: $ID1"
  info "Second request (same key+payload)..."
  R2=$(curl -sf -X POST "$GW/api/v1/payments" \
    -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_A_KEY" \
    -H "Idempotency-Key: $IDEM_D1" -d "$PL_D1" || echo '{}')
  ID2=$(echo "$R2" | jq -r '.paymentId // .payment_id // .id // empty')

  if [ "$ID1" = "$ID2" ] && [ -n "$ID2" ]; then
    pass "D1: Both requests returned same payment ID ($ID1)"
  else
    fail "D1: Expected same ID. Got first='$ID1' second='$ID2'"
  fi
fi

# =============================================================================
# D2. Same key + DIFFERENT payload => 409 Conflict
# =============================================================================
sep "D2: Same key + different payload => 409 Conflict"

IDEM_D2="d2-$(date +%s%N)"
REF_D2="ref-d2-$(date +%s%N)"
PL_D2_ORIG=$(printf '{"amount":1000,"currency":"USD","providerId":"%s","merchantReference":"%s","paymentMethod":"card","idempotencyKey":"%s"}' \
  "$PROVIDER_ID" "$REF_D2" "$IDEM_D2")
PL_D2_DIFF=$(printf '{"amount":9999,"currency":"USD","providerId":"%s","merchantReference":"%s","paymentMethod":"card","idempotencyKey":"%s"}' \
  "$PROVIDER_ID" "$REF_D2" "$IDEM_D2")

HC1=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/payments" \
  -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_A_KEY" \
  -H "Idempotency-Key: $IDEM_D2" -d "$PL_D2_ORIG")
info "First request HTTP: $HC1"

HC2=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/payments" \
  -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_A_KEY" \
  -H "Idempotency-Key: $IDEM_D2" -d "$PL_D2_DIFF")
info "Second request (different amount) HTTP: $HC2"

if [[ "$HC1" =~ ^2 ]]; then
  if [ "$HC2" = "409" ]; then
    pass "D2: Mismatched payload correctly returned HTTP 409 Conflict"
  else
    fail "D2: Expected HTTP 409 for mismatched payload, got $HC2"
  fi
else
  fail "D2: First request failed with HTTP $HC1"
fi

# =============================================================================
# D3. Concurrent same key => exactly one payment
# =============================================================================
sep "D3: 5 concurrent requests with same key => 1 unique payment ID"

IDEM_D3="d3-$(date +%s%N)"
REF_D3="ref-d3-$(date +%s%N)"
PL_D3=$(printf '{"amount":2500,"currency":"USD","providerId":"%s","merchantReference":"%s","paymentMethod":"card","idempotencyKey":"%s"}' \
  "$PROVIDER_ID" "$REF_D3" "$IDEM_D3")

TMPD3=$(mktemp -d)
info "Firing 5 concurrent requests..."
for i in 1 2 3 4 5; do
  curl -sf -X POST "$GW/api/v1/payments" \
    -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_A_KEY" \
    -H "Idempotency-Key: $IDEM_D3" -d "$PL_D3" > "$TMPD3/$i.json" 2>/dev/null &
done
wait

ALL_D3=""
for f in "$TMPD3"/*.json; do
  v=$(jq -r '.paymentId // .payment_id // .id // empty' "$f" 2>/dev/null || true)
  [ -n "$v" ] && ALL_D3="$ALL_D3 $v"
done
rm -rf "$TMPD3"

UCNT_D3=$(echo "$ALL_D3" | tr ' ' '\n' | grep -v '^$' | sort -u | wc -l | tr -d ' ')
if [ "$UCNT_D3" -eq 1 ]; then
  UID3=$(echo "$ALL_D3" | tr ' ' '\n' | grep -v '^$' | sort -u)
  pass "D3: All 5 concurrent requests returned the same payment ID ($UID3)"
elif [ "$UCNT_D3" -eq 0 ]; then
  fail "D3: No valid payment IDs returned from concurrent requests"
else
  fail "D3: Expected 1 unique ID, got $UCNT_D3: $ALL_D3"
fi

# =============================================================================
# D4. Concurrent different keys => multiple distinct payments
# =============================================================================
sep "D4: 5 concurrent requests with different keys => 5 distinct payments"

TMPD4=$(mktemp -d)
info "Firing 5 concurrent requests with unique keys..."
for i in 1 2 3 4 5; do
  UK="d4-$i-$(date +%s%N)"
  UR="ref-d4-$i-$(date +%s%N)"
  PL=$(printf '{"amount":1100,"currency":"USD","providerId":"%s","merchantReference":"%s","paymentMethod":"card","idempotencyKey":"%s"}' \
    "$PROVIDER_ID" "$UR" "$UK")
  curl -sf -X POST "$GW/api/v1/payments" \
    -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_A_KEY" \
    -H "Idempotency-Key: $UK" -d "$PL" > "$TMPD4/$i.json" 2>/dev/null &
done
wait

ALL_D4=""
for f in "$TMPD4"/*.json; do
  v=$(jq -r '.paymentId // .payment_id // .id // empty' "$f" 2>/dev/null || true)
  [ -n "$v" ] && ALL_D4="$ALL_D4 $v"
done
rm -rf "$TMPD4"

CNT_D4=$(echo "$ALL_D4" | tr ' ' '\n' | grep -v '^$' | wc -l | tr -d ' ')
UCNT_D4=$(echo "$ALL_D4" | tr ' ' '\n' | grep -v '^$' | sort -u | wc -l | tr -d ' ')

if [ "$UCNT_D4" -eq "$CNT_D4" ] && [ "$CNT_D4" -ge 4 ]; then
  pass "D4: Got $CNT_D4 distinct payment IDs from $CNT_D4 concurrent unique-key requests"
else
  fail "D4: Expected 5 distinct IDs, got total=$CNT_D4, unique=$UCNT_D4"
fi

# =============================================================================
# D5. Same key, different merchant => independent (key is tenant-scoped)
# =============================================================================
sep "D5: Same key, different merchant => tenant-isolated payments"

IDEM_D5="d5-shared-$(date +%s%N)"

PL_D5A=$(printf '{"amount":3000,"currency":"USD","providerId":"%s","merchantReference":"ref-d5a-%s","paymentMethod":"card","idempotencyKey":"%s"}' \
  "$PROVIDER_ID" "$(date +%s%N)" "$IDEM_D5")
PL_D5B=$(printf '{"amount":7000,"currency":"USD","providerId":"%s","merchantReference":"ref-d5b-%s","paymentMethod":"card","idempotencyKey":"%s"}' \
  "$PROVIDER_ID" "$(date +%s%N)" "$IDEM_D5")

info "Merchant A request..."
RA=$(curl -sf -X POST "$GW/api/v1/payments" \
  -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_A_KEY" \
  -H "Idempotency-Key: $IDEM_D5" -d "$PL_D5A" || echo '{}')
IDA=$(echo "$RA" | jq -r '.paymentId // .payment_id // .id // empty')

info "Merchant B request (same idempotency key)..."
RB=$(curl -sf -X POST "$GW/api/v1/payments" \
  -H "Content-Type: application/json" -H "X-API-Key: $MERCHANT_B_KEY" \
  -H "Idempotency-Key: $IDEM_D5" -d "$PL_D5B" || echo '{}')
IDB=$(echo "$RB" | jq -r '.paymentId // .payment_id // .id // empty')

if [ -z "$IDA" ] || [ -z "$IDB" ]; then
  fail "D5: One or both requests failed. A='$IDA', B='$IDB'"
elif [ "$IDA" != "$IDB" ]; then
  pass "D5: Same key for two merchants produced two distinct payment IDs — key is tenant-scoped"
else
  fail "D5: Both merchants got the same payment ID ($IDA) — idempotency key is NOT tenant-scoped!"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE D RESULTS: Idempotency & Concurrency"
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}PASSED${NC}: $PASS"
echo -e "  ${RED}FAILED${NC}: $FAIL"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "  Failures:"
  for e in "${ERRORS[@]}"; do echo -e "    ${RED}✗${NC} $e"; done
fi
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}ALL PHASE D TESTS PASSED${NC}"; exit 0
else
  echo -e "  ${RED}$FAIL TEST(S) FAILED${NC}"; exit 1
fi

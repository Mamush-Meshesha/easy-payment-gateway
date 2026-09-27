#!/usr/bin/env bash
# =============================================================================
# 05-auth-exhaustive.sh
# Phase E: Security & Authorization Exhaustive Testing
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
# E1: REGISTRATION & LOGIN FAILURES
# =============================================================================
sep "E1: Registration & Login Edge Cases"

# 1. Duplicate Admin Registration
info "Testing duplicate superadmin registration..."
REG_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/auth/register-admin" \
  -H "Content-Type: application/json" -d '{"email":"superadmin2@gateway.com","password":"password123"}')
if [ "$REG_CODE" = "400" ] || [ "$REG_CODE" = "500" ]; then
    pass "Duplicate admin registration rejected (HTTP $REG_CODE)"
else
    fail "Duplicate admin registration should fail but returned HTTP $REG_CODE"
fi

# 2. Missing Fields Login
info "Testing login with missing fields..."
LOGIN_NO_EMAIL=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/auth/login" \
  -H "Content-Type: application/json" -d '{"password":"password123"}')
if [ "$LOGIN_NO_EMAIL" = "400" ]; then
    pass "Login without email rejected (HTTP 400)"
else
    fail "Login without email returned HTTP $LOGIN_NO_EMAIL"
fi

# 3. Invalid Credentials
info "Testing login with invalid credentials..."
LOGIN_INVALID=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"superadmin@gateway.com","password":"WrongPassword!"}')
if [ "$LOGIN_INVALID" = "401" ] || [ "$LOGIN_INVALID" = "400" ]; then
    pass "Login with wrong password rejected"
else
    fail "Login with wrong password returned HTTP $LOGIN_INVALID"
fi

# =============================================================================
# E2: REFRESH TOKEN LIFECYCLE
# =============================================================================
sep "E2: Refresh Token Lifecycle"

info "Logging in to obtain tokens..."
LOGIN_RESP=$(curl -sf -X POST "$GW/api/v1/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"superadmin@gateway.com","password":"password123"}')
ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.accessToken // .token // empty')
REFRESH_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.refreshToken // empty')

if [ -n "$REFRESH_TOKEN" ]; then
    pass "Successfully obtained Refresh Token"
    
    info "Refreshing access token..."
    REFRESH_RESP=$(curl -s -X POST "$GW/api/v1/auth/refresh" \
      -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
    
    NEW_ACCESS=$(echo "$REFRESH_RESP" | jq -r '.accessToken // empty')
    NEW_REFRESH=$(echo "$REFRESH_RESP" | jq -r '.refreshToken // empty')
    
    if [ -n "$NEW_ACCESS" ] && [ -n "$NEW_REFRESH" ]; then
        pass "Successfully refreshed tokens"
        
        info "Attempting to reuse consumed refresh token..."
        REUSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/auth/refresh" \
          -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
        
        if [ "$REUSE_CODE" = "401" ] || [ "$REUSE_CODE" = "400" ]; then
            pass "Reused refresh token rejected"
        else
            fail "Reused refresh token allowed! (HTTP $REUSE_CODE)"
        fi
    else
        fail "Failed to refresh token. Response: $REFRESH_RESP"
    fi
else
    fail "Did not receive Refresh Token on login"
fi

# =============================================================================
# E3: INVALID TOKENS & API KEYS
# =============================================================================
sep "E3: JWT Signatures & Malformed API Keys"

info "Testing missing Authorization header (Merchants endpoint)..."
NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/merchants" -d '{}')
if [ "$NO_AUTH" = "401" ]; then
    pass "Missing Authorization header rejected (HTTP 401)"
else
    fail "Missing Authorization header returned HTTP $NO_AUTH"
fi

info "Testing invalid JWT signature..."
# Alter the last character of the valid signature
INVALID_JWT="${ACCESS_TOKEN%?}X"
BAD_SIG=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/merchants" \
  -H "Authorization: Bearer $INVALID_JWT" -d '{}')
if [ "$BAD_SIG" = "401" ]; then
    pass "Invalid JWT signature rejected (HTTP 401)"
else
    fail "Invalid JWT signature returned HTTP $BAD_SIG"
fi

VALID_PAYLOAD="{\"merchantReference\":\"ref-1\",\"amount\":100,\"currency\":\"USD\",\"paymentMethod\":\"card\",\"providerId\":\"11111111-1111-1111-1111-111111111111\"}"

info "Testing missing API Key (Payments endpoint)..."
NO_API_KEY=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/payments" \
  -H "Content-Type: application/json" -H "Idempotency-Key: test-123" -d "$VALID_PAYLOAD")
if [ "$NO_API_KEY" = "401" ]; then
    pass "Missing API Key rejected (HTTP 401)"
else
    fail "Missing API Key returned HTTP $NO_API_KEY"
fi

info "Testing malformed API Key format..."
BAD_API_KEY=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/payments" \
  -H "Content-Type: application/json" -H "Idempotency-Key: test-123" -H "X-API-Key: malformed_key" -d "$VALID_PAYLOAD")
if [ "$BAD_API_KEY" = "401" ]; then
    pass "Malformed API Key rejected (HTTP 401)"
else
    fail "Malformed API Key returned HTTP $BAD_API_KEY"
fi

# =============================================================================
# E4: DISABLED USER ACCOUNT
# =============================================================================
sep "E4: Disabled User Login"

TS=$(date +%s)
DISABLED_EMAIL="disabled-$TS@test.com"

info "Creating merchant (and user) to disable..."
MERCH_ID=$(curl -sf -X POST "$GW/api/v1/merchants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"legalName\":\"Disabled\",\"displayName\":\"Disabled\",\"defaultCurrency\":\"USD\",\"ownerEmail\":\"$DISABLED_EMAIL\",\"country\":\"ET\"}" \
  | jq -r '.id // empty')

if [ -n "$MERCH_ID" ]; then
    info "Waiting for async user creation..."
    sleep 2
    
    info "Setting password and status=DISABLED in DB..."
    docker exec payment_postgres psql -U postgres -d payment_gateway -c \
      "UPDATE \"Credential\" SET \"passwordHash\" = (SELECT \"passwordHash\" FROM \"Credential\" c JOIN \"User\" u ON u.id = c.\"userId\" WHERE u.email = 'superadmin@gateway.com') WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = '$DISABLED_EMAIL');" >/dev/null
    docker exec payment_postgres psql -U postgres -d payment_gateway -c \
      "UPDATE \"User\" SET status = 'DISABLED' WHERE email = '$DISABLED_EMAIL';" >/dev/null
    
    info "Attempting login with disabled account..."
    DISABLED_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/v1/auth/login" \
      -H "Content-Type: application/json" -d "{\"email\":\"$DISABLED_EMAIL\",\"password\":\"password123\"}")
      
    if [ "$DISABLED_LOGIN" = "401" ] || [ "$DISABLED_LOGIN" = "403" ] || [ "$DISABLED_LOGIN" = "400" ]; then
        pass "Disabled user login rejected"
    else
        fail "Disabled user login allowed! (HTTP $DISABLED_LOGIN)"
    fi
else
    fail "Failed to create merchant for disabled user test"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE E RESULTS: Security & Authorization"
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
  echo -e "  ${GREEN}ALL PHASE E TESTS PASSED${NC}"; exit 0
else
  echo -e "  ${RED}$FAIL TEST(S) FAILED${NC}"; exit 1
fi

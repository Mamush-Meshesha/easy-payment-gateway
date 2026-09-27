#!/usr/bin/env bash
# =============================================================================
# 08-ledger-invariants.sh
# Phase F: Financial Invariant Testing (Ledger & Accounting)
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
# F1: BOOTSTRAP & TRAFFIC GENERATION
# =============================================================================
sep "F1: Bootstrap & Traffic Generation"

info "Logging in as superadmin..."
ADMIN_TOKEN=$(curl -sf -X POST "$GW/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gateway.com","password":"password123"}' \
  | jq -r '.accessToken // empty')
[ -z "$ADMIN_TOKEN" ] && { echo -e "${RED}FATAL${NC}: Login failed"; exit 1; }

TS=$(date +%s)
info "Creating Merchant for Ledger Test..."
MERCH_ID=$(curl -sf -X POST "$GW/api/v1/merchants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"legalName\":\"Ledger Inc\",\"displayName\":\"Ledger Inc\",\"defaultCurrency\":\"USD\",\"ownerEmail\":\"ledger-$TS@test.com\",\"country\":\"US\"}" \
  | jq -r '.id // empty')
[ -z "$MERCH_ID" ] && { echo -e "${RED}FATAL${NC}: Merchant creation failed"; exit 1; }

API_KEY=$(curl -sf -X POST "$GW/api/v1/merchants/$MERCH_ID/apikeys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"ledger-key"}' \
  | jq -r '.rawKey // empty')
[ -z "$API_KEY" ] && { echo -e "${RED}FATAL${NC}: API key creation failed"; exit 1; }

PROVIDER_ID=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c \
  "SELECT id FROM providers WHERE status = 'ACTIVE' LIMIT 1;" 2>/dev/null | tr -d ' \n')
[ -z "$PROVIDER_ID" ] && { echo -e "${RED}FATAL${NC}: No active provider in DB"; exit 1; }

info "Creating static Ledger Accounts (Merchant Liability and Provider Asset)..."
docker exec payment_postgres psql -U postgres -d payment_gateway -c \
  "INSERT INTO accounts (id, name, type, currency, balance, status) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Merchant Liability', 'LIABILITY', 'USD', 0, 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222222', 'Provider Asset', 'ASSET', 'USD', 0, 'ACTIVE')
  ON CONFLICT (id) DO NOTHING;" >/dev/null

info "Firing 10 concurrent payments and generating provider webhooks..."
TMPD=$(mktemp -d)
for i in {1..10}; do
  AMNT=$((i * 100))
  PL=$(printf '{"amount":%d,"currency":"USD","providerId":"%s","merchantReference":"ref-ldg-%s-%d","paymentMethod":"card"}' \
    "$AMNT" "$PROVIDER_ID" "$TS" "$i")
  
  RESP=$(curl -s -X POST "$GW/api/v1/payments" \
    -H "Content-Type: application/json" -H "X-API-Key: $API_KEY" -H "Idempotency-Key: idem-ldg-$TS-$i" -d "$PL")
  PAYMENT_ID=$(echo "$RESP" | jq -r '.id // empty')
    
  if [ -n "$PAYMENT_ID" ]; then
    echo "{\"paymentId\": \"$PAYMENT_ID\", \"providerId\": \"$PROVIDER_ID\", \"providerTransactionId\": \"tel_$PAYMENT_ID\", \"status\": \"SUCCESS\", \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" >> "$TMPD/events.jsonl"
  else
    fail "Failed to create payment $i. Response: $RESP"
  fi
done

info "Simulating Provider Webhook via Kafka for all payments..."
if [ -f "$TMPD/events.jsonl" ]; then
  cat "$TMPD/events.jsonl" | docker exec -i payment_kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic provider.normalized.event >/dev/null
fi
rm -rf "$TMPD"

info "Allowing 5 seconds for async saga completion (transaction -> payment -> ledger)..."
sleep 5

# =============================================================================
# F2: DOUBLE-ENTRY BALANCE INVARIANT
# =============================================================================
sep "F2: Double-Entry Balance Invariant"

info "Querying Ledger totals..."
SQL_TOTALS="
SELECT 
  COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END), 0) as debit_total,
  COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END), 0) as credit_total
FROM journal_lines;
"
TOTALS=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "$SQL_TOTALS" 2>/dev/null | xargs)
DEBIT_TOTAL=$(echo "$TOTALS" | awk '{print $1}')
CREDIT_TOTAL=$(echo "$TOTALS" | awk '{print $3}')

info "Total Debits:  $DEBIT_TOTAL"
info "Total Credits: $CREDIT_TOTAL"

if [ -n "$DEBIT_TOTAL" ] && [ "$DEBIT_TOTAL" != "0" ] && [ "$DEBIT_TOTAL" = "$CREDIT_TOTAL" ]; then
    pass "Ledger Double-Entry Invariant: sum(debits) == sum(credits)"
else
    fail "Ledger unbalanced! Debits=$DEBIT_TOTAL, Credits=$CREDIT_TOTAL"
fi

# =============================================================================
# F3: ACCOUNT BALANCE INVARIANT (DERIVED VS STORED)
# =============================================================================
sep "F3: Account Balance Integrity"

SQL_ACC="
WITH calculated AS (
  SELECT 
    account_id,
    SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END) as debit_sum,
    SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END) as credit_sum
  FROM journal_lines
  GROUP BY account_id
)
SELECT 
  a.id,
  a.type,
  a.balance as stored_balance,
  CASE 
    WHEN a.type IN ('ASSET', 'EXPENSE') THEN c.debit_sum - c.credit_sum
    WHEN a.type IN ('LIABILITY', 'EQUITY', 'REVENUE') THEN c.credit_sum - c.debit_sum
    ELSE 0
  END as derived_balance
FROM accounts a
JOIN calculated c ON a.id = c.account_id
WHERE 
  a.balance <> CASE 
    WHEN a.type IN ('ASSET', 'EXPENSE') THEN c.debit_sum - c.credit_sum
    WHEN a.type IN ('LIABILITY', 'EQUITY', 'REVENUE') THEN c.credit_sum - c.debit_sum
    ELSE 0
  END;
"
MISMATCHES=$(docker exec payment_postgres psql -U postgres -d payment_gateway -t -c "$SQL_ACC" 2>/dev/null | xargs)

if [ -z "$MISMATCHES" ]; then
    pass "All Account Balances exactly match the derived sum of their journal lines"
else
    fail "Account Balance Mismatch detected: $MISMATCHES"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PHASE F RESULTS: Financial Invariants"
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
  echo -e "  ${GREEN}ALL PHASE F TESTS PASSED${NC}"; exit 0
else
  echo -e "  ${RED}$FAIL TEST(S) FAILED${NC}"; exit 1
fi

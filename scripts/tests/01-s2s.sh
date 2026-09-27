#!/bin/bash
set -e

echo "==================================================="
echo "  PHASE 1: SERVICE-TO-SERVICE COMMUNICATION MATRIX"
echo "==================================================="

CA_CERT="infra/certs/ca.crt"
PROTO_PATH="packages/protobuf/src"

function test_s2s() {
    local caller=$1
    local target_host=$2
    local target_port=$3
    local target_svc=$4
    local proto_file=$5
    local rpc=$6
    local expected_status=$7

    echo -n "Testing $caller -> $target_svc/$rpc ... "
    
    # We pass an empty JSON body for simplicity.
    # The goal is to see if we get a PermissionDenied or if we pass the interceptor
    # and hit the actual application logic (which might return an application error like Invalid UUID, but NOT PermissionDenied).
    
    # Capture stderr as well as stdout
    local out
    out=$(grpcurl -cacert $CA_CERT \
        -cert infra/certs/$caller.crt \
        -key infra/certs/$caller.key \
        -authority $target_host \
        -import-path $PROTO_PATH \
        -proto $proto_file \
        -d '{}' \
        localhost:$target_port $rpc 2>&1) || true
    
    local exit_code=$?
    
    if [ "$expected_status" == "ALLOW" ]; then
        if echo "$out" | grep -q "PermissionDenied"; then
            echo "❌ FAILED (Expected ALLOW, got PermissionDenied)"
            echo "Output: $out"
            exit 1
        elif echo "$out" | grep -q "Unauthenticated"; then
            echo "❌ FAILED (Expected ALLOW, got Unauthenticated)"
            echo "Output: $out"
            exit 1
        else
            echo "✅ PASS (Allowed by interceptor)"
        fi
    elif [ "$expected_status" == "DENY" ]; then
        if echo "$out" | grep -q "PermissionDenied"; then
            echo "✅ PASS (Denied as expected)"
        else
            echo "❌ FAILED (Expected DENY, got something else)"
            echo "Output: $out"
            exit 1
        fi
    else
        echo "❌ FAILED (Unknown expected status: $expected_status)"
        exit 1
    fi
}

echo "Testing ALLOWED paths..."
test_s2s "settlement-service" "ledger-service" 50053 "ledger-service" "ledger.proto" "ledger.LedgerService/ReserveFunds" "ALLOW"
test_s2s "payment-service" "risk-service" 50054 "risk-service" "risk.proto" "risk.RiskService/CheckRisk" "ALLOW"
test_s2s "payment-service" "merchant-service" 50052 "merchant-service" "merchant.proto" "merchant.MerchantService/ValidateApiKey" "ALLOW"
test_s2s "payment-service" "provider-service" 50055 "provider-service" "provider.proto" "provider.ProviderService/InitiatePayment" "ALLOW"
test_s2s "dashboard-service" "ledger-service" 50053 "ledger-service" "ledger.proto" "ledger.LedgerService/GetLedgerBalances" "ALLOW"

echo "Testing DENIED paths (Zero Trust verification)..."
test_s2s "reporting-service" "ledger-service" 50053 "ledger-service" "ledger.proto" "ledger.LedgerService/ReserveFunds" "DENY"
test_s2s "webhook-service" "risk-service" 50054 "risk-service" "risk.proto" "risk.RiskService/CheckRisk" "DENY"
test_s2s "risk-service" "merchant-service" 50052 "merchant-service" "merchant.proto" "merchant.MerchantService/ValidateApiKey" "DENY"
test_s2s "dashboard-service" "ledger-service" 50053 "ledger-service" "ledger.proto" "ledger.LedgerService/RecordJournalEntry" "DENY"

echo "Phase 1: S2S Matrix fully verified."

#!/bin/bash
set -e

echo "==================================================="
echo "  FULL SYSTEM INTEGRATION & E2E VALIDATION RUNNER"
echo "==================================================="

# 1. Verify infrastructure
echo "[1/3] Verifying Infrastructure..."
if ! docker compose ps | grep -q "Up"; then
    echo "ERROR: Docker infrastructure is not running. Run 'docker compose up -d' first."
    exit 1
fi

# 2. Verify services are healthy
echo "[2/3] Verifying Service Health..."
SERVICES=("3001" "3002" "3003" "8084" "8085" "8086" "8087")
for PORT in "${SERVICES[@]}"; do
    if ! nc -z localhost $PORT; then
        echo "ERROR: Service on port $PORT is not reachable!"
        exit 1
    fi
done
echo "All required HTTP ports are open."

# 3. Execute test suites
echo "[3/3] Executing Test Suites..."

TEST_DIR="scripts/tests"

# Run tests in alphabetical dependency order
for test_script in $(ls $TEST_DIR/*.sh | sort); do
    echo "---------------------------------------------------"
    echo "Running: $test_script"
    echo "---------------------------------------------------"
    if bash "$test_script"; then
        echo "✅ PASS: $test_script"
    else
        echo "❌ FAIL: $test_script"
        echo "HALTING VALIDATION ON FAILURE."
        exit 1
    fi
done

echo "==================================================="
echo "ALL TESTS PASSED SUCCESSFULLY!"
echo "==================================================="

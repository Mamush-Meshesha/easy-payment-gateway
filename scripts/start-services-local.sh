#!/bin/bash
# start-services-local.sh

mkdir -p logs
PID_FILE="logs/local.pids"

if [ -f "$PID_FILE" ]; then
    echo "ERROR: $PID_FILE exists. Services might already be running."
    echo "Run ./scripts/stop-services-local.sh first!"
    exit 1
fi

echo "Starting Postgres, Redis, and Kafka in Docker..."
docker compose up -d postgres redis kafka kafka-init

echo "Waiting for databases to initialize (15s)..."
sleep 15

# Export environment variables for local native execution
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/payment_gateway?sslmode=disable"
export KAFKA_BROKERS="localhost:9094"
export REDIS_URL="redis://localhost:6379"

export AUTH_SERVICE_HOST="localhost"
export AUTH_GRPC_PORT="50051"
export MERCHANT_SERVICE_ADDR="localhost:50052"
export LEDGER_SERVICE_ADDR="localhost:50053"
export RISK_SERVICE_ADDR="localhost:50054"
export PROVIDER_SERVICE_ADDR="localhost:50055"
export MTLS_CA_CERT="$PWD/infra/certs/ca.crt"

echo "Deploying Node.js database migrations natively..."
(cd services/auth-service && npx prisma migrate deploy)
(cd services/merchant-service && npx prisma migrate deploy)
(cd services/notification-service && npx prisma migrate deploy)
(cd services/reporting-service && npx prisma migrate deploy)

echo "Compiling ALL Node.js projects..."
if ! npm run build -ws; then
    echo "ERROR: Node.js compilation failed!"
    exit 1
fi

echo "Compiling ALL Go services..."
mkdir -p bin
for svc in payment-service ledger-service risk-service provider-service transaction-service webhook-service settlement-service reconciliation-service; do
    echo "Building $svc..."
    if ! (cd services/$svc && go build -o ../../bin/$svc ./cmd/server); then
        echo "ERROR: Go compilation failed for $svc!"
        exit 1
    fi
done

echo "Starting core services natively..."

function start_node_service() {
    local svc_name=$1
    local port=$2
    local cert=$3
    local key=$4

    echo "Starting $svc_name on port $port..."
    if [ -n "$cert" ]; then
        (cd services/$svc_name && PORT=$port MTLS_SERVER_CERT=$cert MTLS_SERVER_KEY=$key npm run start > ../../logs/$svc_name.log 2>&1) &
    else
        (cd services/$svc_name && PORT=$port npm run start > ../../logs/$svc_name.log 2>&1) &
    fi
    local pid=$!
    echo $pid >> $PID_FILE

    # Healthcheck
    for i in {1..20}; do
        if nc -z localhost $port; then
            echo "   -> $svc_name is UP"
            return 0
        fi
        sleep 1
    done
    echo "ERROR: $svc_name failed to start on port $port!"
    echo "---- TAIL OF logs/$svc_name.log ----"
    tail -n 30 logs/$svc_name.log
    ./scripts/stop-services-local.sh
    exit 1
}

function start_go_service() {
    local svc_name=$1
    local port=$2
    local cert=$3
    local key=$4

    echo "Starting $svc_name on port $port..."
    PORT=$port MTLS_SERVER_CERT=$cert MTLS_SERVER_KEY=$key ./bin/$svc_name > logs/$svc_name.log 2>&1 &
    local pid=$!
    echo $pid >> $PID_FILE

    # Healthcheck
    for i in {1..15}; do
        if nc -z localhost $port; then
            echo "   -> $svc_name is UP"
            return 0
        fi
        sleep 1
    done
    echo "ERROR: $svc_name failed to start on port $port!"
    echo "---- TAIL OF logs/$svc_name.log ----"
    tail -n 30 logs/$svc_name.log
    ./scripts/stop-services-local.sh
    exit 1
}

function start_go_worker() {
    local svc_name=$1

    echo "Starting $svc_name (worker)..."
    ./bin/$svc_name > logs/$svc_name.log 2>&1 &
    local pid=$!
    echo $pid >> $PID_FILE

    # Simple healthcheck: just verify it didn't exit immediately
    sleep 2
    if ! kill -0 $pid 2>/dev/null; then
        echo "ERROR: $svc_name (worker) failed to start!"
        echo "---- TAIL OF logs/$svc_name.log ----"
        tail -n 30 logs/$svc_name.log
        ./scripts/stop-services-local.sh
        exit 1
    fi
    echo "   -> $svc_name is UP (Running)"
}

# Start Node.js Services (Using unique ports)
start_node_service "auth-service" 3001 "../../infra/certs/auth-service.crt" "../../infra/certs/auth-service.key"
start_node_service "merchant-service" 3002 "../../infra/certs/merchant-service.crt" "../../infra/certs/merchant-service.key"
start_node_service "admin-service" 3003 "../../infra/certs/admin-service.crt" "../../infra/certs/admin-service.key"

# Start Go Services
start_go_service "payment-service" 8084 "infra/certs/payment-service.crt" "infra/certs/payment-service.key"
start_go_service "ledger-service" 8085 "infra/certs/ledger-service.crt" "infra/certs/ledger-service.key"
start_go_service "risk-service" 8086 "infra/certs/risk-service.crt" "infra/certs/risk-service.key"
start_go_service "provider-service" 8087 "infra/certs/provider-service.crt" "infra/certs/provider-service.key"

# Start Go Workers
start_go_worker "transaction-service"
start_go_worker "webhook-service"
start_go_worker "settlement-service"
start_go_worker "reconciliation-service"

echo ""
echo "=========================================================="
echo "SUCCESS! All core services started natively & verified."
echo "Logs are available in the 'logs/' directory."
echo "To stop everything cleanly, run: ./scripts/stop-services-local.sh"
echo "You can now run 'scripts/test-happy-path.sh'."
echo "=========================================================="

echo "Press Ctrl+C (or stop the script) to tear down the environment."
wait

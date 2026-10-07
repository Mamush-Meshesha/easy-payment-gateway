#!/bin/bash
set -e

echo "=========================================================="
echo "    Payment Gateway - Production-Like Deployment Script"
echo "=========================================================="

if [ -z "$1" ]; then
    echo "Usage: ./scripts/deploy-production-like.sh <VM_IP_ADDRESS>"
    echo "Example: ./scripts/deploy-production-like.sh 192.168.122.9"
    exit 1
fi

VM_IP=$1
SSH_USER="mamush"
SSH_KEY="~/.ssh/payment_gateway_vm"
DEPLOY_DIR="/home/$SSH_USER/payment-gateway"

echo "🚀 Preparing deployment to $VM_IP..."

# 1. Sync the codebase to the VM using rsync
echo "📦 Syncing codebase to the VM..."
# We exclude node_modules, logs, and venv to save bandwidth and ensure a clean build on the target machine
rsync -avz --exclude 'node_modules' \
           --exclude '.git' \
           --exclude 'logs' \
           --exclude 'venv' \
           --exclude '.env.local' \
           -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
           ./ $SSH_USER@$VM_IP:$DEPLOY_DIR/

# 2. Connect and deploy
echo "⚙️ Building and starting services on the VM..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_USER@$VM_IP << EOF
    set -e
    cd $DEPLOY_DIR
    
    echo "[VM] Shutting down any old containers..."
    sudo docker compose -f docker-compose.infra.yml -f docker-compose.yml down || true
    
    echo "[VM] Starting infrastructure (Postgres, Redis, Kafka, Nginx)..."
    sudo docker compose -f docker-compose.infra.yml up -d
    
    echo "[VM] Waiting 15 seconds for infrastructure to initialize..."
    sleep 15
    
    echo "[VM] Building and deploying all microservices (limited concurrency)..."
    export COMPOSE_PARALLEL_LIMIT=2
    sudo -E docker compose -f docker-compose.yml up -d --build
    
    echo "[VM] 🚀 Deployment Complete!"
EOF

echo ""
echo "✅ Finished!"
echo "API Gateway should now be accessible via your host machine at http://$VM_IP:8080"

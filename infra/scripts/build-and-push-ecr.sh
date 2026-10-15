#!/usr/bin/env bash
# ==============================================================================
# Payment Gateway — Automated Microservice Build & ECR Push Pipeline
# Milestone 5: Production Container Deployment to AWS Stockholm (eu-north-1)
# ==============================================================================
set -euo pipefail

# Configuration
AWS_REGION="${AWS_REGION:-eu-north-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-431636668603}"
PROJECT_NAME="payment-gateway"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
AWS_BIN="$(command -v aws || echo "$HOME/.local/bin/aws")"

# All 16 Microservices
SERVICES=(
  "auth-service"
  "payment-service"
  "merchant-service"
  "billing-service"
  "admin-service"
  "dashboard-service"
  "reporting-service"
  "dispute-service"
  "ledger-service"
  "risk-service"
  "provider-service"
  "settlement-service"
  "reconciliation-service"
  "notification-service"
  "transaction-service"
  "webhook-service"
)

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

TARGET_SERVICE="${1:-all}"
ACTION="${2:-build-and-push}" # build-only, push-only, or build-and-push

# Check Docker
if ! docker info >/dev/null 2>&1; then
  log_error "Docker daemon is not running. Please start Docker and retry."
  exit 1
fi

# Ensure AWS CLI is available
if ! "$AWS_BIN" --version >/dev/null 2>&1; then
  log_error "AWS CLI not found at $AWS_BIN."
  exit 1
fi

# Authenticate Docker against AWS ECR
authenticate_ecr() {
  log_info "Authenticating Docker with AWS ECR in $AWS_REGION..."
  local login_pass
  login_pass="$("$AWS_BIN" ecr get-login-password --region "$AWS_REGION")"
  echo "$login_pass" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
  log_success "Successfully authenticated with $ECR_REGISTRY"
}

build_service() {
  local service="$1"
  local dockerfile="services/$service/Dockerfile"
  local local_tag="$PROJECT_NAME/$service:latest"
  local remote_tag="$ECR_REGISTRY/$PROJECT_NAME/$service:latest"

  if [ ! -f "$dockerfile" ]; then
    log_error "Dockerfile not found: $dockerfile"
    return 1
  fi

  log_info "==> Building container image for [$service]..."
  docker build -t "$local_tag" -t "$remote_tag" -f "$dockerfile" .
  log_success "Built and tagged: $remote_tag"
}

push_service() {
  local service="$1"
  local remote_tag="$ECR_REGISTRY/$PROJECT_NAME/$service:latest"
  local max_attempts=4
  local attempt=1

  log_info "==> Pushing [$service] to ECR ($remote_tag)..."
  while [ $attempt -le $max_attempts ]; do
    if docker push "$remote_tag"; then
      log_success "Successfully pushed: $remote_tag"
      return 0
    else
      log_warn "Push attempt $attempt failed for [$service]."
      if [ $attempt -lt $max_attempts ]; then
        sleep $((attempt * 3))
        log_info "Retrying push for [$service] (attempt $((attempt + 1))/$max_attempts)..."
      fi
      attempt=$((attempt + 1))
    fi
  done

  log_error "Failed to push [$service] after $max_attempts attempts."
  return 1
}

process_service() {
  local service="$1"
  echo ""
  log_info "=========================================================="
  log_info "Processing service: $service"
  log_info "=========================================================="

  if [ "$ACTION" == "push-only" ]; then
    push_service "$service"
  elif [ "$ACTION" == "build-only" ]; then
    build_service "$service"
  else
    build_service "$service" && push_service "$service"
  fi
}

# Main Execution Flow
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ "$ACTION" != "build-only" ]; then
  authenticate_ecr
fi

START_TIME=$(date +%s)
FAILED_SERVICES=()

if [ "$TARGET_SERVICE" == "all" ]; then
  log_info "Starting batch deployment for all ${#SERVICES[@]} microservices..."
  for svc in "${SERVICES[@]}"; do
    if ! process_service "$svc"; then
      FAILED_SERVICES+=("$svc")
    fi
  done
else
  # Verify target service is valid
  found=false
  for svc in "${SERVICES[@]}"; do
    if [ "$svc" == "$TARGET_SERVICE" ]; then
      found=true
      break
    fi
  done

  if [ "$found" = false ]; then
    log_error "Unknown service: $TARGET_SERVICE"
    echo "Available services:"
    for svc in "${SERVICES[@]}"; do echo "  - $svc"; done
    exit 1
  fi

  if ! process_service "$TARGET_SERVICE"; then
    FAILED_SERVICES+=("$TARGET_SERVICE")
  fi
fi

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
  log_error "The following services failed: ${FAILED_SERVICES[*]}"
  exit 1
fi

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

echo ""
log_success "=========================================================="
log_success "All operations completed in ${TOTAL_DURATION}s!"
log_success "=========================================================="

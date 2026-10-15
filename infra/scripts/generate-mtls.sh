#!/bin/bash
set -e

CERTS_DIR="$(pwd)/infra/certs"
mkdir -p "$CERTS_DIR"

echo "Generating Root CA..."
# Root CA Private Key
openssl genrsa -out "$CERTS_DIR/ca.key" 4096

# Root CA Certificate
openssl req -x509 -new -nodes -key "$CERTS_DIR/ca.key" -sha256 -days 3650 -out "$CERTS_DIR/ca.crt" \
  -subj "/C=US/ST=State/L=City/O=PaymentGateway/CN=PaymentGateway Root CA"

# Services list
SERVICES=(
  "payment-service"
  "merchant-service"
  "risk-service"
  "provider-service"
  "ledger-service"
  "transaction-service"
  "webhook-service"
  "settlement-service"
  "reconciliation-service"
  "auth-service"
  "notification-service"
  "reporting-service"
  "admin-service"
  "dashboard-service"
  "billing-service"
  "dispute-service"
  "vault-service"
  "pricing-service"
  "routing-service"
  "fx-service"
)

# Generate certs for each service
for SERVICE in "${SERVICES[@]}"; do
  echo "Generating certificate for $SERVICE..."
  
  # Private Key
  openssl genrsa -out "$CERTS_DIR/$SERVICE.key" 2048
  
  # CSR config with SPIFFE URI and AWS Cloud Map DNS names
  cat > "$CERTS_DIR/$SERVICE.ext" <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $SERVICE
DNS.2 = $SERVICE.payment-gateway.internal
DNS.3 = localhost
IP.1 = 127.0.0.1
URI.1 = spiffe://payment-gateway/ns/production/sa/$SERVICE
EOF

  # CSR
  openssl req -new -key "$CERTS_DIR/$SERVICE.key" -out "$CERTS_DIR/$SERVICE.csr" \
    -subj "/C=US/ST=State/L=City/O=PaymentGateway/CN=$SERVICE"
    
  # Issue Certificate signed by Root CA
  openssl x509 -req -in "$CERTS_DIR/$SERVICE.csr" -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" \
    -CAcreateserial -out "$CERTS_DIR/$SERVICE.crt" -days 825 -sha256 -extfile "$CERTS_DIR/$SERVICE.ext"
    
  # Cleanup temp files
  rm "$CERTS_DIR/$SERVICE.csr" "$CERTS_DIR/$SERVICE.ext"
done

# Generate Nginx SSL certs
NGINX_CERTS_DIR="$(pwd)/infra/nginx/certs"
mkdir -p "$NGINX_CERTS_DIR"
if [ ! -f "$NGINX_CERTS_DIR/selfsigned.crt" ]; then
  echo "Generating Nginx selfsigned certificates..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$NGINX_CERTS_DIR/selfsigned.key" \
    -out "$NGINX_CERTS_DIR/selfsigned.crt" \
    -subj "/CN=localhost"
fi

echo "All certificates generated successfully in $CERTS_DIR and $NGINX_CERTS_DIR"

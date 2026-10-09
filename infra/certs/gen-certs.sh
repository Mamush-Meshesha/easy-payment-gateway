#!/bin/bash
cd infra/certs
for svc in auth-service merchant-service admin-service dashboard-service notification-service reporting-service payment-service transaction-service provider-service webhook-service ledger-service reconciliation-service settlement-service risk-service billing-service dispute-service pricing-service; do
  openssl genrsa -out $svc.key 2048
  openssl req -new -key $svc.key -out $svc.csr -subj "/CN=$svc"
  cat > $svc.ext <<EOM
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = $svc
DNS.2 = localhost
IP.1 = 127.0.0.1
URI.1 = spiffe://payment-gateway/ns/local/sa/$svc
EOM
  openssl x509 -req -in $svc.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out $svc.crt -days 365 -sha256 -extfile $svc.ext
  rm $svc.csr $svc.ext
done

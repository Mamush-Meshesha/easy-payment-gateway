import * as grpc from '@grpc/grpc-js';
import path from 'path';
import fs from 'fs';
import { MerchantProto } from '@payment-gateway/protobuf';

let client: MerchantProto.MerchantServiceClient | null = null;

export function getMerchantClient() {
  if (client) return client;

  const certDir = process.env.CERTS_DIR || '/app/certs';
  const caPath = process.env.MTLS_CA_CERT || path.join(certDir, 'ca.crt');
  const certPath = process.env.MTLS_CLIENT_CERT || path.join(certDir, 'auth-service.crt');
  const keyPath = process.env.MTLS_CLIENT_KEY || path.join(certDir, 'auth-service.key');

  let credentials;
  try {
    const caCert = fs.readFileSync(caPath);
    const clientCert = fs.readFileSync(certPath);
    const clientKey = fs.readFileSync(keyPath);
    credentials = grpc.credentials.createSsl(caCert, clientKey, clientCert);
  } catch (err) {
    console.warn('Falling back to insecure credentials for MerchantClient:', err);
    credentials = grpc.credentials.createInsecure();
  }

  const host = process.env.MERCHANT_SERVICE_HOST || 'merchant-service';
  const port = process.env.MERCHANT_GRPC_PORT || '50052';
  
  client = new MerchantProto.MerchantServiceClient(
    `${host}:${port}`,
    credentials
  );

  return client;
}

export function provisionMerchantViaGrpc(merchantId: string, email: string, businessName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const c = getMerchantClient();
    // @ts-ignore
    c.provisionMerchant({ merchantId, email, businessName }, (error: any, response: any) => {
      if (error) {
        return reject(error);
      }
      if (!response.success) {
        return reject(new Error(response.error));
      }
      resolve(true);
    });
  });
}

import * as grpc from '@grpc/grpc-js';
import fs from 'fs';
import { logger } from './logger';

export function getGrpcCredentials(): grpc.ChannelCredentials {
  try {
    const caCertPath = process.env.MTLS_CA_CERT || '/app/certs/ca.crt';
    const clientCertPath = process.env.MTLS_SERVER_CERT || '/app/certs/dashboard-service.crt';
    const clientKeyPath = process.env.MTLS_SERVER_KEY || '/app/certs/dashboard-service.key';

    if (fs.existsSync(caCertPath) && fs.existsSync(clientCertPath) && fs.existsSync(clientKeyPath)) {
      const caCert = fs.readFileSync(caCertPath);
      const clientCert = fs.readFileSync(clientCertPath);
      const clientKey = fs.readFileSync(clientKeyPath);
      return grpc.credentials.createSsl(caCert, clientKey, clientCert);
    }
  } catch (err: any) {
    logger.warn('Failed to load mTLS certificates, falling back to insecure: ' + err.message);
  }
  return grpc.credentials.createInsecure();
}

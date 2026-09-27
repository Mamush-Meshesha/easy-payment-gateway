import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const PROTO_PATH = path.resolve(__dirname, '../../../../packages/protobuf/src/merchant.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

let credentials = grpc.credentials.createInsecure();
try {
  const caCert = fs.readFileSync(process.env.MTLS_CA_CERT || path.resolve(__dirname, '../../../../infra/certs/ca.crt'));
  const clientCert = fs.readFileSync(process.env.MTLS_SERVER_CERT || path.resolve(__dirname, '../../../../infra/certs/admin-service.crt'));
  const clientKey = fs.readFileSync(process.env.MTLS_SERVER_KEY || path.resolve(__dirname, '../../../../infra/certs/admin-service.key'));
  credentials = grpc.credentials.createSsl(caCert, clientKey, clientCert);
} catch (err: any) {
  logger.warn('mTLS certs not found, fallback to insecure (ONLY for local dev outside docker). ' + err.message);
}

export const merchantClient = new protoDescriptor.merchant.MerchantService(
  process.env.MERCHANT_SERVICE_ADDR || 'merchant-service:50052',
  credentials
);

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { createClientCredentials } from 'ts-grpc-auth';

const PROTO_PATH = path.resolve(__dirname, '../../../packages/protobuf/src/merchant.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

const certDir = path.resolve(__dirname, '../../../infra/certs');
const caPath = process.env.MTLS_CA_CERT || path.join(certDir, 'ca.crt');
// Need auth-service cert for ProvisionMerchant
const certPath = path.join(certDir, 'auth-service.crt');
const keyPath = path.join(certDir, 'auth-service.key');

const credentials = createClientCredentials(caPath, certPath, keyPath);

const merchantClient = new protoDescriptor.merchant.MerchantService(
  'localhost:50052',
  credentials
);

const merchantId = 'b0000000-0000-0000-0000-000000000000';

merchantClient.ProvisionMerchant({
  merchantId: merchantId,
  email: 'badguy@cartel.com',
  businessName: 'Sanctioned Cartel LLC'
}, (err: any, response: any) => {
  if (err) {
    console.error('Failed to provision:', err.message);
  } else {
    console.log('Provisioned fake merchant:', response);
  }
});

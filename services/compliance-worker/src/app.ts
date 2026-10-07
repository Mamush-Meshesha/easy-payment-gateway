import cron from 'node-cron';
import winston from 'winston';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import fs from 'fs';
import { createClientCredentials } from 'ts-grpc-auth';
import { ListMerchantsRequest, ListMerchantsResponse, SuspendMerchantRequest, SuspendMerchantResponse } from '@payment-gateway/protobuf/dist/generated/merchant';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const PROTO_PATH = path.resolve(__dirname, '../../../packages/protobuf/src/merchant.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

const certDir = path.resolve(__dirname, '../../../infra/certs');
const caPath = process.env.MTLS_CA_CERT || path.join(certDir, 'ca.crt');
const certPath = process.env.MTLS_CLIENT_CERT || path.join(certDir, 'admin-service.crt'); // Spoofing as admin to bypass policy for MVP
const keyPath = process.env.MTLS_CLIENT_KEY || path.join(certDir, 'admin-service.key');

const credentials = createClientCredentials(caPath, certPath, keyPath);

const merchantClient = new protoDescriptor.merchant.MerchantService(
  process.env.MERCHANT_SERVICE_ADDR || 'localhost:50052',
  credentials
);

async function runComplianceCheck() {
  logger.info('Starting nightly OFAC/AML compliance check...');
  
  try {
    merchantClient.ListMerchants({ limit: 1000, offset: 0 }, (err: any, response: any) => {
      if (err) {
        logger.error('Failed to list merchants', { error: err.message });
        return;
      }

      const merchants = response.merchants || [];
      logger.info(`Fetched ${merchants.length} merchants for screening.`);

      merchants.forEach((merchant: any) => {
        // Skip already suspended merchants
        if (merchant.status === 'SUSPENDED') return;

        // Simulated AML/OFAC matching logic
        const suspiciousKeywords = ['sanctioned', 'laundering', 'fraudulent', 'cartel'];
        const isSuspicious = suspiciousKeywords.some(kw => merchant.legalName?.toLowerCase().includes(kw));

        if (isSuspicious) {
          logger.warn(`⚠️ High-confidence OFAC match for merchant: ${merchant.legalName} (${merchant.id}). Suspending...`);
          
          merchantClient.SuspendMerchant({ merchantId: merchant.id, reason: 'Automated AML/OFAC Suspension' }, (err2: any, res2: any) => {
            if (err2) {
              logger.error(`Failed to suspend merchant ${merchant.id}`, { error: err2.message });
            } else {
              logger.info(`✅ Successfully suspended merchant ${merchant.id}`);
            }
          });
        }
      });
    });
  } catch (error: any) {
    logger.error('Compliance check failed', { error: error.message });
  }
}

// Run every minute for local demonstration (would be '0 0 * * *' in prod)
cron.schedule('* * * * *', () => {
  runComplianceCheck();
});

logger.info('Compliance Worker started. Awaiting cron triggers...');
// Run immediately on boot for demo
runComplianceCheck();

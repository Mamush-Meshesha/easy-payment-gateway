import * as grpc from '@grpc/grpc-js';
import path from 'path';
import { MerchantServiceService, MerchantServiceServer } from '@payment-gateway/protobuf/dist/generated/merchant';
import { logger } from '../utils/logger';
import { applyAuthInterceptor, createServerCredentials } from 'ts-grpc-auth';
import { ValidateApiKeyRequest, ValidateApiKeyResponse, GetMerchantConfigRequest, GetMerchantConfigResponse, GetWebhookConfigRequest, GetWebhookConfigResponse, GetPayoutDestinationRequest, GetPayoutDestinationResponse, ListMerchantsRequest, ListMerchantsResponse, SuspendMerchantRequest, SuspendMerchantResponse, UpdateMerchantLimitRequest, UpdateMerchantLimitResponse } from '@payment-gateway/protobuf/dist/generated/merchant';
import { prisma } from '../dal/prisma';

// The Authorization Matrix Policy
const S2S_POLICY: Record<string, string[]> = {
  '/merchant.MerchantService/ValidateApiKey': ['payment-service'],
  '/merchant.MerchantService/GetMerchantConfig': ['payment-service'],
  '/merchant.MerchantService/GetMerchant': ['payment-service'],
  '/merchant.MerchantService/GetWebhookConfig': ['webhook-service'],
  '/merchant.MerchantService/GetPayoutDestination': ['settlement-service'],
  '/merchant.MerchantService/ListMerchants': ['admin-service'],
  '/merchant.MerchantService/SuspendMerchant': ['admin-service'],
  '/merchant.MerchantService/UpdateMerchantLimit': ['admin-service'],
  '/merchant.MerchantService/ProvisionMerchant': ['auth-service'],
};

function authPolicy(identity: { environment: string; serviceName: string }, fullMethod: string): boolean {
  const allowed = S2S_POLICY[fullMethod];
  if (!allowed) return false;
  return allowed.includes(identity.serviceName);
}

const merchantServiceHandler: MerchantServiceServer = {
  provisionMerchant: applyAuthInterceptor<any, any>(async (call: any, callback: any) => {
    try {
      const { merchantId, email, businessName } = call.request;
      
      const merchant = await prisma.merchant.upsert({
        where: { id: merchantId },
        update: {},
        create: {
          id: merchantId,
          legalName: businessName || 'Auto-Provisioned Merchant',
          displayName: businessName || 'Auto-Provisioned Merchant',
          country: 'ET', // Default for now
          defaultCurrency: 'ETB',
          status: 'ACTIVE' // Explicitly make active for self-serve signups
        }
      });
      
      logger.info('Provisioned merchant via gRPC from auth-service', { merchantId });
      callback(null, { success: true, error: '' });
    } catch (error: any) {
      logger.error(`[gRPC] Failed to provision merchant: ${error.message}`);
      callback(null, { success: false, error: error.message });
    }
  }, authPolicy, '/merchant.MerchantService/ProvisionMerchant'),

  getMerchantStatus: (call: any, callback: any) => {
    callback(null, { status: "ACTIVE", exists: true });
  },

  getMerchant: applyAuthInterceptor<any, any>(async (call: any, callback: any) => {
    try {
      const merchantId = call.request.merchantId;
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId }
      });
      if (!merchant) {
        callback({ code: grpc.status.NOT_FOUND, message: 'Merchant not found' }, null);
        return;
      }
      callback(null, { 
        id: merchant.id, 
        legalName: merchant.legalName, 
        status: merchant.status 
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/GetMerchant'),

  validateApiKey: applyAuthInterceptor<ValidateApiKeyRequest, ValidateApiKeyResponse>(async (call: any, callback: any) => {
    try {
      const apiKeyRaw = call.request.apiKey;
      const crypto = require('crypto');
      const keyHash = crypto.createHash('sha256').update(apiKeyRaw).digest('hex');

      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { merchant: true }
      });

      if (apiKey && apiKey.status === 'ACTIVE' && apiKey.merchant.status === 'ACTIVE') {
        callback(null, { 
          isValid: true, 
          merchantId: apiKey.merchantId, 
          environment: apiKey.environment.toUpperCase()
        });
        return;
      }

      callback(null, { isValid: false, merchantId: '', environment: '' });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/ValidateApiKey'),

  getMerchantConfig: applyAuthInterceptor<GetMerchantConfigRequest, GetMerchantConfigResponse>(async (call: any, callback: any) => {
    try {
      const merchantId = call.request.merchantId;
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: { preferences: true, paymentMethods: true }
      });

      if (!merchant) {
        callback({ code: grpc.status.NOT_FOUND, message: 'Merchant not found' }, null);
        return;
      }

      const feeRouting = merchant.preferences?.transactionFeePayer || 'MERCHANT';
      const enabledMethods = merchant.paymentMethods
        .filter(pm => pm.isEnabled)
        .map(pm => pm.methodCode);
      const version = merchant.preferences?.version || 1;

      callback(null, { 
        merchantId, 
        version,
        feeRouting,
        enabledPaymentMethods: enabledMethods
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/GetMerchantConfig'),

  getWebhookConfig: applyAuthInterceptor<GetWebhookConfigRequest, GetWebhookConfigResponse>(async (call: any, callback: any) => {
    try {
      const { merchantId, environment } = call.request;
      const envFilter = environment ? environment.toUpperCase() : 'LIVE';
      
      const config = await prisma.webhookConfig.findFirst({
        where: { 
          merchantId, 
          environment: envFilter,
          isActive: true 
        }
      });
      if (!config) {
        callback({ code: grpc.status.NOT_FOUND, message: `Webhook config not found for environment: ${envFilter}` }, null);
        return;
      }
      callback(null, { webhookUrl: config.url, hmacSecret: config.secretHash || 'dummy-secret-not-stored-raw' });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/GetWebhookConfig'),

  getPayoutDestination: applyAuthInterceptor<GetPayoutDestinationRequest, GetPayoutDestinationResponse>(async (call: any, callback: any) => {
    try {
      const merchantId = call.request.merchantId;
      // Simulating DB fetch - ideally this would be added to the prisma schema
      callback(null, { destinationToken: 'tok_default123', destinationBank: 'BANK_OF_TEST', providerId: 'default' });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/GetPayoutDestination'),

  listMerchants: applyAuthInterceptor<ListMerchantsRequest, ListMerchantsResponse>(async (call: any, callback: any) => {
    try {
      const limit = call.request.limit || 10;
      const offset = call.request.offset || 0;
      const merchants = await prisma.merchant.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      });
      const total = await prisma.merchant.count();
      
      const response: ListMerchantsResponse = {
        merchants: merchants.map((m: any) => ({
          id: m.id,
          legalName: m.legalName,
          status: m.status,
          createdAt: m.createdAt.toISOString()
        })),
        total
      };
      callback(null, response);
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/ListMerchants'),

  suspendMerchant: applyAuthInterceptor<SuspendMerchantRequest, SuspendMerchantResponse>(async (call: any, callback: any) => {
    try {
      const { merchantId, reason } = call.request;
      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
      if (!merchant) {
        callback({ code: grpc.status.NOT_FOUND, message: 'Merchant not found' }, null);
        return;
      }
      
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { status: 'SUSPENDED' }
      });
      
      logger.info('Merchant suspended', { merchantId, reason });
      callback(null, { success: true, status: 'SUSPENDED' });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/SuspendMerchant'),

  updateMerchantLimit: applyAuthInterceptor<UpdateMerchantLimitRequest, UpdateMerchantLimitResponse>(async (call: any, callback: any) => {
    try {
      const { merchantId, currency, minAmount, maxAmount } = call.request;
      
      await prisma.merchantLimit.upsert({
        where: { merchantId_currency: { merchantId, currency } },
        update: { minAmount: BigInt(minAmount), maxAmount: BigInt(maxAmount) },
        create: { merchantId, currency, minAmount: BigInt(minAmount), maxAmount: BigInt(maxAmount) }
      });
      
      logger.info('Merchant limits updated', { merchantId, currency, minAmount: minAmount.toString(), maxAmount: maxAmount.toString() });
      callback(null, { success: true });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: 'Internal error' }, null);
    }
  }, authPolicy, '/merchant.MerchantService/UpdateMerchantLimit')
};

export function startGrpcServer() {
  const server = new grpc.Server();

  // Apply the generated TS service
  server.addService(MerchantServiceService, merchantServiceHandler as any);

  const certDir = path.resolve(__dirname, '../../../../infra/certs');
  const caPath = process.env.MTLS_CA_CERT || path.join(certDir, 'ca.crt');
  const certPath = process.env.MTLS_SERVER_CERT || path.join(certDir, 'merchant-service.crt');
  const keyPath = process.env.MTLS_SERVER_KEY || path.join(certDir, 'merchant-service.key');

  let credentials;
  try {
    credentials = createServerCredentials(caPath, certPath, keyPath);
    logger.info('Starting gRPC server with strict mTLS enabled.');
  } catch (err: any) {
    logger.error('Failed to load mTLS certificates: ' + err.message);
    process.exit(1);
  }

  const port = process.env.GRPC_PORT || '50052';
  server.bindAsync(`0.0.0.0:${port}`, credentials, (err, boundPort) => {
    if (err) {
      logger.error('Failed to bind gRPC server:', err);
      return;
    }
    server.start();
    logger.info(`Merchant gRPC server listening on port ${boundPort}`);
  });
}

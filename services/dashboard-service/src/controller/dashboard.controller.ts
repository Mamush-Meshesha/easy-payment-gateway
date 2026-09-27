import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { buildRequestContext } from '../context/request-context.builder';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import fs from 'fs';
import { serializeRequestContext } from 'ts-grpc-auth';

const PROTO_PATH = path.resolve(__dirname, '../../../../packages/protobuf/src/payment_read.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const caCert = fs.readFileSync(process.env.MTLS_CA_CERT || '/app/certs/ca.crt');
const clientCert = fs.readFileSync(process.env.MTLS_SERVER_CERT || '/app/certs/server.crt');
const clientKey = fs.readFileSync(process.env.MTLS_SERVER_KEY || '/app/certs/server.key');
const credentials = grpc.credentials.createSsl(caCert, clientKey, clientCert);

const client = new protoDescriptor.payment_read.PaymentReadService(
  process.env.PAYMENT_SERVICE_ADDR || 'payment-service:50051',
  credentials
);

const PROTO_PATH_LEDGER = path.resolve(__dirname, '../../../../packages/protobuf/src/ledger.proto');
const ledgerPackageDef = protoLoader.loadSync(PROTO_PATH_LEDGER, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const ledgerProtoDesc = grpc.loadPackageDefinition(ledgerPackageDef) as any;
const ledgerClient = new ledgerProtoDesc.ledger.LedgerService(
  process.env.LEDGER_SERVICE_ADDR || 'ledger-service:50053',
  credentials
);

/**
 * DashboardController — BFF aggregation layer for merchant UI.
 *
 * Each handler:
 *   1. Extracts the authenticated merchant from the verified JWT (req.user)
 *   2. Builds a RequestContext from the JWT — not from client-supplied headers
 *   3. Calls downstream services via gRPC with the context in metadata
 *   4. Downstream services independently enforce tenant isolation
 *
 * NOTE: gRPC clients would be injected via DI in a fuller implementation.
 * Here they are resolved at handler-time from environment config.
 */
export class DashboardController {
  /**
   * GET /api/v1/dashboard/payments
   * Retrieves payment summary for the authenticated merchant.
   * The merchant_id is taken from the JWT — NOT from the query string.
   */
  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      const limit = parseInt(req.query.limit as string) || 50;
      const cursor = req.query.cursor as string || '';

      client.GetPayments({ 
        merchant_id: merchantId,
        after_cursor: cursor,
        limit: limit 
      }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetPayments error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          const resData = response || {};
          if (resData.payments && Array.isArray(resData.payments)) {
            resData.payments = resData.payments.map((p: any) => ({
              ...p,
              id: p.payment_id || p.paymentId,
              customerId: p.customer_id || p.customerId,
              method: p.payment_method || p.paymentMethod || p.method,
              createdAt: p.created_at || p.createdAt,
              amount: p.amount,
              currency: p.currency,
              status: p.status
            }));
          }
          res.json(resData);
        } catch (e) {
          next(e);
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/balances
   * Returns ledger balances for the authenticated merchant.
   */
  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      logger.info('Dashboard balance query', {
        merchantId,
        userId: user.userId,
      });

      ledgerClient.GetLedgerBalances({ 
        merchant_id: merchantId,
        currency: req.query.currency as string || ''
      }, metadata, (err: any, response: any) => {
        if (err) {
          logger.error('gRPC GetLedgerBalances error', { error: err.message });
          res.status(500).json({ error: 'Failed to fetch ledger balances' });
          return;
        }
        res.json(response || {});
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/transactions
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }

      logger.info('Dashboard transaction query', { merchantId });
      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);
      
      const limit = parseInt(req.query.limit as string) || 50;
      const cursor = req.query.cursor as string || '';

      ledgerClient.GetLedgerEntriesPaginated({
        merchant_id: merchantId,
        currency: req.query.currency as string || '',
        after_cursor: cursor,
        limit: limit
      }, metadata, (err: any, response: any) => {
        if (err) {
          logger.error('gRPC GetLedgerEntriesPaginated error', { error: err.message });
          res.status(500).json({ error: 'Failed to fetch ledger entries' });
          return;
        }
        res.json(response || {});
      });
    } catch (err) {
      next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { buildRequestContext } from '../context/request-context.builder';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import fs from 'fs';
import { serializeRequestContext } from 'ts-grpc-auth';

const PROTO_PATH = path.resolve(__dirname, '../../../../packages/protobuf/src/ledger.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const caCert = fs.readFileSync(process.env.MTLS_CA_CERT || '/app/certs/ca.crt');
const clientCert = fs.readFileSync(process.env.MTLS_SERVER_CERT || '/app/certs/dashboard-service.crt');
const clientKey = fs.readFileSync(process.env.MTLS_SERVER_KEY || '/app/certs/dashboard-service.key');
const credentials = grpc.credentials.createSsl(caCert, clientKey, clientCert);

const client = new protoDescriptor.ledger.LedgerService(
  process.env.LEDGER_SERVICE_ADDR || 'ledger-service:50053',
  credentials
);

export class LedgerReadController {
  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      const isSuperAdmin = user?.roles?.some((r: any) => r.role === 'SUPER_ADMIN');
      if (!merchantId && !isSuperAdmin) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }
      if (isSuperAdmin && !merchantId) {
        merchantId = '';
      }

      // Check if trying to access a specific account ID, if so, the architecture requires merchant ownership validation
      // But the RPC just takes merchant_id and returns all balances.
      const accountId = req.params.id; // Optional to filter, but RPC might not support it yet.
      
      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      client.GetLedgerBalances({ merchant_id: merchantId }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetLedgerBalances error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          
          if (accountId) {
            const acc = (response?.balances || []).find((b: any) => b.accountId === accountId);
            if (!acc) {
              res.status(404).json({ error: 'Account not found or not owned by merchant' });
              return;
            }
            res.json(acc);
            return;
          }

          res.json(response?.balances || []);
        } catch (e) {
          next(e);
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      let merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      const isSuperAdmin = user?.roles?.some((r: any) => r.role === 'SUPER_ADMIN');
      if (!merchantId && !isSuperAdmin) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }
      if (isSuperAdmin && !merchantId) {
        merchantId = '';
      }

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      const limit = parseInt(req.query.limit as string) || 50;
      const cursor = req.query.cursor as string || '';

      client.GetLedgerEntriesPaginated({ 
        merchant_id: merchantId,
        after_cursor: cursor,
        limit: limit
      }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetLedgerEntriesPaginated error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          res.json(response || {});
        } catch (e) {
          next(e);
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { buildRequestContext } from '../context/request-context.builder';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import fs from 'fs';

const PROTO_PATH = path.resolve(__dirname, '../../../../packages/protobuf/src/settlement_read.proto');
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

const client = new protoDescriptor.settlement_read.SettlementReadService(
  process.env.SETTLEMENT_SERVICE_ADDR || 'settlement-service:50057',
  credentials
);

const LEDGER_PROTO_PATH = path.resolve(__dirname, '../../../../packages/protobuf/src/ledger.proto');
const ledgerPackageDef = protoLoader.loadSync(LEDGER_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const ledgerProtoDesc = grpc.loadPackageDefinition(ledgerPackageDef) as any;
const ledgerClient = new ledgerProtoDesc.ledger.LedgerService(
  process.env.LEDGER_SERVICE_ADDR || 'ledger-service:50053',
  credentials
);

export class SettlementReadController {
  async getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      client.GetSettlements({ merchant_id: merchantId, limit, offset }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetSettlements error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          
          const data = response?.settlements || [];
          const total = response?.total || 0;
          const page = Math.floor(offset / limit) + 1;
          const totalPages = Math.ceil(total / limit);

          res.json({
            data,
            total,
            page,
            limit,
            totalPages
          });
        } catch (callbackErr) {
          next(callbackErr);
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getSettlementBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      ledgerClient.GetLedgerBalances({ merchant_id: merchantId }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetLedgerBalances error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }

          let availableBalance = 0;
          let pendingSettlement = 0;
          let currency = 'USD'; // default

          const balances = response?.balances || [];
          for (const b of balances) {
            if (b.accountType === 'AVAILABLE') {
              availableBalance = parseInt(b.balanceMinorUnits) || 0;
              currency = b.currency;
            } else if (b.accountType === 'RESERVED') {
              pendingSettlement = parseInt(b.balanceMinorUnits) || 0;
            }
          }

          res.json({
            availableBalance,
            pendingSettlement,
            currency
          });
        } catch (callbackErr) {
          next(callbackErr);
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

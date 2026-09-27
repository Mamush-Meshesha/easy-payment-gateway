import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { buildRequestContext } from '../context/request-context.builder';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import fs from 'fs';

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

export class RefundReadController {
  async getRefunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }

      const paymentId = req.query.paymentId as string || '';
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      client.GetRefunds({ merchant_id: merchantId, payment_id: paymentId, limit, offset }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetRefunds error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          
          const data = response?.refunds || [];
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
}

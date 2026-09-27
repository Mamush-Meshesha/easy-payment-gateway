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

export class PaymentReadController {
  async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      client.GetPayment({ payment_id: req.params.id, merchant_id: merchantId }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetPayment error', { error: err.message });
            if (err.code === grpc.status.NOT_FOUND) {
              res.status(404).json({ error: 'Payment not found' });
              return;
            }
            if (err.code === grpc.status.PERMISSION_DENIED) {
              res.status(403).json({ error: 'Permission denied' });
              return;
            }
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          const payment = response?.payment || {};
          res.json({
            ...payment,
            id: payment.paymentId || payment.payment_id,
            customerId: payment.customerId || payment.customer_id,
            method: payment.paymentMethod || payment.payment_method || payment.method,
            createdAt: payment.createdAt || payment.created_at,
            updatedAt: payment.updatedAt || payment.updated_at
          });
        } catch (e) {
          next(e);
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

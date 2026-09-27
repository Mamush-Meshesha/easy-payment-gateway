import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { buildRequestContext } from '../context/request-context.builder';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import fs from 'fs';

const PROTO_PATH = path.resolve(__dirname, '../../../../packages/protobuf/src/webhook_read.proto');
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

const client = new protoDescriptor.webhook_read.WebhookReadService(
  process.env.WEBHOOK_SERVICE_ADDR || 'webhook-service:50056',
  credentials
);

export class WebhookReadController {
  async getDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(403).json({ error: 'Forbidden: merchant context required' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      client.GetWebhookDeliveries({ merchant_id: merchantId, limit, offset }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetWebhookDeliveries error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          
          const data = response?.deliveries || [];
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

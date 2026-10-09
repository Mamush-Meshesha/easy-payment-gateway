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
const clientCert = fs.readFileSync(process.env.MTLS_SERVER_CERT || '/app/certs/dashboard-service.crt');
const clientKey = fs.readFileSync(process.env.MTLS_SERVER_KEY || '/app/certs/dashboard-service.key');
const credentials = grpc.credentials.createSsl(caCert, clientKey, clientCert);

const client = new protoDescriptor.webhook_read.WebhookReadService(
  process.env.WEBHOOK_SERVICE_ADDR || 'webhook-service:50056',
  credentials
);

export class WebhookReadController {
  async getDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      client.GetWebhookDeliveries({ merchant_id: merchantId, limit, offset }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC GetWebhookDeliveries error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          
          let data = response?.deliveries || [];
          data = data.map((d: any) => ({
            id: d.id,
            merchantId: d.merchant_id,
            eventId: d.event_id,
            eventType: d.event_type,
            status: d.status,
            attemptCount: d.attempt_count,
            responseStatusCode: d.response_status_code,
            responseBody: d.response_body,
            createdAt: d.created_at,
            nextRetryAt: d.next_retry_at,
            lastError: d.last_error,
            payload: d.payload,
          }));

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

  async replayDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const deliveryId = req.params.id;
      if (!deliveryId) {
        res.status(400).json({ error: 'Delivery ID is required' });
        return;
      }

      const environment = (req.headers['x-environment'] as string)?.toUpperCase() || 'LIVE';
      const metadata = buildRequestContext(user, environment);

      client.ReplayWebhookDelivery({ merchant_id: merchantId, delivery_id: deliveryId }, metadata, (err: any, response: any) => {
        try {
          if (err) {
            logger.error('gRPC ReplayWebhookDelivery error', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
          
          if (!response.success) {
            res.status(400).json({ error: response.message });
            return;
          }

          res.json({
            success: true,
            message: response.message,
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

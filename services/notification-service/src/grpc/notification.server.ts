import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notification.service';
import { deserializeRequestContext, requireMerchant } from 'ts-grpc-auth';
import fs from 'fs';

const PROTO_PATH = path.resolve(__dirname, '../../../../packages/protobuf/src/notification_read.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

export class NotificationGrpcServer {
  private server: grpc.Server;

  constructor(private readonly notificationService: NotificationService) {
    this.server = new grpc.Server();
    this.server.addService(protoDescriptor.notification_read.NotificationReadService.service, {
      GetNotifications: this.getNotifications.bind(this),
    });
  }

  private async getNotifications(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) {
    try {
      const reqCtx = deserializeRequestContext(call.metadata);
      const reqMerchantId = call.request.merchant_id;
      
      requireMerchant(reqCtx, reqMerchantId);

      const merchantId = reqMerchantId;

      const limit = call.request.limit || 50;
      const offset = call.request.offset || 0;

      const { data, total } = await this.notificationService.getNotificationsPaginated(merchantId, limit, offset);

      const notifications = data.map((n) => ({
        id: n.id,
        merchant_id: n.merchantId,
        type: n.channel,
        recipient: n.recipientEmail || n.recipientPhone || 'UNKNOWN',
        subject: n.subject || '',
        status: n.status,
        error_details: n.lastErrorMessage || n.lastErrorCode || '',
        created_at: n.createdAt.toISOString(),
      }));

      callback(null, { notifications, total });
    } catch (err: any) {
      logger.error('gRPC GetNotifications error', { error: err.message });
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      }, null);
    }
  }

  public start(port: string) {
    let credentials = grpc.ServerCredentials.createInsecure();
    if (process.env.MTLS_SERVER_CERT && process.env.MTLS_SERVER_KEY && process.env.MTLS_CA_CERT) {
        const caCert = fs.readFileSync(process.env.MTLS_CA_CERT);
        const serverCert = fs.readFileSync(process.env.MTLS_SERVER_CERT);
        const serverKey = fs.readFileSync(process.env.MTLS_SERVER_KEY);
        credentials = grpc.ServerCredentials.createSsl(caCert, [{
            cert_chain: serverCert,
            private_key: serverKey
        }], true);
    }

    this.server.bindAsync(`0.0.0.0:${port}`, credentials, (err, boundPort) => {
      if (err) {
        logger.error('Failed to bind gRPC server', { error: err.message });
        return;
      }
      logger.info(`Notification gRPC server listening on port ${boundPort}`);
    });
  }

  public stop() {
    this.server.forceShutdown();
  }
}

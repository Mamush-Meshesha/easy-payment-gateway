import './instrumentation';
import 'reflect-metadata';
import express from 'express';
import { metricsMiddleware, metricsEndpoint } from '@payment-gateway/shared-observability';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './utils/logger';
import { EmailSender } from './services/email.sender';
import { NotificationService } from './services/notification.service';
import { NotificationWorker } from './services/notification.worker';
import { PaymentNotificationConsumer } from './events/payment.consumer';
import notificationRoutes from './routes/notification.routes';
import { NotificationGrpcServer } from './grpc/notification.server';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Observability Metrics
app.use(metricsMiddleware());
app.get('/metrics', metricsEndpoint);

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// API Routes
app.use('/api/v1/notifications', notificationRoutes);

// Global error handler — prevents leaking stack traces
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3007;

if (process.env.NODE_ENV !== 'test') {
  const emailSender = new EmailSender();
  const notificationService = new NotificationService();
  const notificationWorker = new NotificationWorker(emailSender);
  const paymentConsumer = new PaymentNotificationConsumer(notificationService);

  app.listen(PORT, async () => {
    logger.info(`Notification service listening on port ${PORT}`);

    const grpcServer = new NotificationGrpcServer(notificationService);
    grpcServer.start(process.env.GRPC_PORT || '50058');

    notificationWorker.start();

    await paymentConsumer.start().catch((err) => {
      logger.error('Failed to start Kafka consumer', { error: err.message });
      process.exit(1);
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down notification service');
    notificationWorker.stop();
    await paymentConsumer.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;

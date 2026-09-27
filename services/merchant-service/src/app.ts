import './instrumentation';
import 'reflect-metadata';
import express from 'express';
import { metricsMiddleware, metricsEndpoint } from '@payment-gateway/shared-observability';
import helmet from 'helmet';
import cors from 'cors';
import merchantRoutes from './routes/merchant.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { logger } from './utils/logger';
import { OutboxPublisher } from './outbox/publisher';
import { startGrpcServer } from './grpc/merchant.server';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Observability Metrics
app.use(metricsMiddleware());
app.get('/metrics', metricsEndpoint);

// Routes
app.use('/api/v1/merchants', merchantRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

if (process.env.NODE_ENV !== 'test') {
  const outboxPublisher = new OutboxPublisher();

  app.listen(PORT, async () => {
    logger.info(`Merchant service listening on port ${PORT}`);
    await outboxPublisher.start().catch(err => {
      logger.error('Failed to start Outbox Publisher:', err);
    });
    logger.info('Outbox publisher started');
    
    // Start mTLS gRPC Server
    startGrpcServer();
  });
}

export default app;

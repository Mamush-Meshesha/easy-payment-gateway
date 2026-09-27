import './instrumentation';
import 'reflect-metadata';
import express from 'express';
import { metricsMiddleware, metricsEndpoint } from '@payment-gateway/shared-observability';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { logger } from './utils/logger';
import { MerchantConsumer } from './events/merchant.consumer';
import { startGrpcServer } from './grpc/auth.server';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Observability Metrics
app.use(metricsMiddleware());
app.get('/metrics', metricsEndpoint);

// Routes
app.use('/api/v1/auth', authRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  const merchantConsumer = new MerchantConsumer();
  
  startGrpcServer();

  app.listen(PORT, async () => {
    logger.info(`Auth service listening on port ${PORT}`);
    
    await merchantConsumer.start().catch(err => {
      logger.error('Failed to start MerchantConsumer:', err);
    });
    logger.info('Merchant consumer started');
  });
}

export default app;

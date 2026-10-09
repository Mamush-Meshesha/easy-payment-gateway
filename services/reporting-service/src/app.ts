import './instrumentation';
import 'reflect-metadata';
import express from 'express';
import { metricsMiddleware, metricsEndpoint } from '@payment-gateway/shared-observability';
import helmet from 'helmet';
import cors from 'cors';
import reportRoutes from './routes/report.routes';
import { authenticateJWT } from '@payment-gateway/shared-auth';
import { logger } from './utils/logger';
import { PaymentProjectionConsumer } from './events/payment.projection';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Observability Metrics
app.use(metricsMiddleware());
app.get('/metrics', metricsEndpoint);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'reporting-service' }));

// All report routes require a valid JWT
app.use('/api/v1/reporting', authenticateJWT as any, reportRoutes);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.SERVICE_PORT || 3008;

if (process.env.NODE_ENV !== 'test') {
  const paymentProjection = new PaymentProjectionConsumer();

  app.listen(PORT, async () => {
    logger.info(`Reporting service listening on port ${PORT}`);
    await paymentProjection.start().catch((err) => {
      logger.error('Failed to start projection consumer', { error: err.message });
      process.exit(1);
    });
  });

  const shutdown = async () => {
    logger.info('Shutting down reporting service');
    await paymentProjection.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;

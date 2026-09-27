import './instrumentation';
import 'reflect-metadata';
import express from 'express';
import { metricsMiddleware, metricsEndpoint } from '@payment-gateway/shared-observability';
import helmet from 'helmet';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.routes';
import { authenticateJWT } from '@payment-gateway/shared-auth';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Observability Metrics
app.use(metricsMiddleware());
app.get('/metrics', metricsEndpoint);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'dashboard-service' }));

import paymentRoutes from './routes/payment.routes';
import ledgerRoutes from './routes/ledger.routes';

// All dashboard routes require a valid JWT. Tenant isolation is enforced per-handler.
(app as any).use('/api/v1/dashboard', authenticateJWT, dashboardRoutes);
(app as any).use('/api/v1/payments', authenticateJWT, paymentRoutes);
(app as any).use('/api/v1/ledger', authenticateJWT, ledgerRoutes);

import { standardErrorHandler } from '@payment-gateway/api-errors';

// Standard canonical error handler — must be last middleware
app.use(standardErrorHandler);

const PORT = process.env.PORT || 3009;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT as number, '0.0.0.0', () => {
    logger.info(`Dashboard service listening on port ${PORT}`);
  });
}

export default app;

import './instrumentation';
import 'reflect-metadata';
import express from 'express';
import { metricsMiddleware, metricsEndpoint } from '@payment-gateway/shared-observability';
import helmet from 'helmet';
import cors from 'cors';
import adminRoutes from './routes/admin.routes';
import { authenticateJWT } from '@payment-gateway/shared-auth';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Observability Metrics
app.use(metricsMiddleware());
app.get('/metrics', metricsEndpoint);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'admin-service' }));

// All admin endpoints require JWT auth + SUPER_ADMIN role (enforced at route level)
(app as any).use('/api/v1/admin', authenticateJWT, adminRoutes);

import { standardErrorHandler } from '@payment-gateway/api-errors';

// Standard canonical error handler — must be last middleware
app.use(standardErrorHandler);

const PORT = process.env.SERVICE_PORT || 3003;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Admin service listening on port ${PORT}`);
  });
}

export default app;

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import * as promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// 1. OpenTelemetry Tracing
// ---------------------------------------------------------------------------
export function initTracing(serviceName: string) {
  const exporter = new OTLPTraceExporter({
    // Jaeger / Zipkin OTLP gRPC endpoint. Defaults to localhost:4317
    url: process.env.OTLP_ENDPOINT || 'grpc://localhost:4317', 
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error: any) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

// ---------------------------------------------------------------------------
// 2. Prometheus Metrics
// ---------------------------------------------------------------------------
const register = new promClient.Registry();

// Enable default metrics (memory, event loop lag, etc.)
promClient.collectDefaultMetrics({ register });

// Define custom HTTP request metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDurationMicroseconds);

/**
 * Express Middleware to track request duration and status
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
      // Use req.route?.path to avoid high cardinality from dynamic IDs in URLs
      const route = req.route && req.route.path ? req.route.path : req.path;
      end({ route, code: res.statusCode, method: req.method });
    });
    next();
  };
}

/**
 * Express Handler to expose /metrics for Prometheus to scrape
 */
export async function metricsEndpoint(req: Request, res: Response) {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}

// ---------------------------------------------------------------------------
// 3. Structured Logging helpers
// ---------------------------------------------------------------------------
import winston from 'winston';

export function createStructuredLogger(serviceName: string) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json() // Forces JSON for Logstash/Elasticsearch
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console()
    ],
  });
}

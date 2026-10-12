"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTracing = initTracing;
exports.metricsMiddleware = metricsMiddleware;
exports.metricsEndpoint = metricsEndpoint;
exports.createStructuredLogger = createStructuredLogger;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const promClient = __importStar(require("prom-client"));
// ---------------------------------------------------------------------------
// 1. OpenTelemetry Tracing
// ---------------------------------------------------------------------------
function initTracing(serviceName) {
    const exporter = new exporter_trace_otlp_grpc_1.OTLPTraceExporter({
        // Jaeger / Zipkin OTLP gRPC endpoint. Defaults to localhost:4317
        url: process.env.OTLP_ENDPOINT || 'grpc://localhost:4317',
    });
    const sdk = new sdk_node_1.NodeSDK({
        resource: new resources_1.Resource({
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
        traceExporter: exporter,
        instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
    });
    sdk.start();
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => console.log('Tracing terminated'))
            .catch((error) => console.log('Error terminating tracing', error))
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
function metricsMiddleware() {
    return (req, res, next) => {
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
async function metricsEndpoint(req, res) {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
}
// ---------------------------------------------------------------------------
// 3. Structured Logging helpers
// ---------------------------------------------------------------------------
const winston_1 = __importDefault(require("winston"));
function createStructuredLogger(serviceName) {
    return winston_1.default.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json() // Forces JSON for Logstash/Elasticsearch
        ),
        defaultMeta: { service: serviceName },
        transports: [
            new winston_1.default.transports.Console()
        ],
    });
}

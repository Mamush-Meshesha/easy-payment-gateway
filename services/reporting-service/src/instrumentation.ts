import { initTracing } from '@payment-gateway/shared-observability';

// Must run before any other imports
initTracing('reporting-service');

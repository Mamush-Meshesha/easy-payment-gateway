/**
 * Kafka Trace Propagation Helpers
 *
 * Producers inject W3C Trace Context (traceparent, tracestate) plus correlation/causation IDs
 * into Kafka record headers. Consumers extract them to continue the trace.
 *
 * IMPORTANT: No JWTs, API keys, or authentication credentials are placed in Kafka headers.
 * Kafka ACLs enforce access control independently.
 */

export interface TraceHeaders {
  traceparent?: string;
  tracestate?: string;
  correlationId?: string;
  causationId?: string;
}

export const TRACEPARENT_HEADER = 'traceparent';
export const TRACESTATE_HEADER = 'tracestate';
export const CORRELATION_ID_HEADER = 'correlation-id';
export const CAUSATION_ID_HEADER = 'causation-id';

/**
 * Converts TraceHeaders into KafkaJS-compatible record header map.
 * Only defined values are included — never undefined or null headers.
 */
export function buildKafkaHeaders(trace: TraceHeaders): Record<string, string> {
  const headers: Record<string, string> = {};
  if (trace.traceparent) headers[TRACEPARENT_HEADER] = trace.traceparent;
  if (trace.tracestate) headers[TRACESTATE_HEADER] = trace.tracestate;
  if (trace.correlationId) headers[CORRELATION_ID_HEADER] = trace.correlationId;
  if (trace.causationId) headers[CAUSATION_ID_HEADER] = trace.causationId;
  return headers;
}

/**
 * Extracts trace propagation headers from a Kafka message.
 * Missing headers resolve to undefined, not empty strings.
 * A failure to extract trace headers MUST NOT interrupt message processing.
 */
export function extractKafkaTraceHeaders(
  headers: Record<string, Buffer | string | null | undefined> | undefined
): TraceHeaders {
  if (!headers) return {};

  const get = (key: string): string | undefined => {
    const val = headers[key];
    if (val == null) return undefined;
    return Buffer.isBuffer(val) ? val.toString('utf-8') : (val as string);
  };

  return {
    traceparent: get(TRACEPARENT_HEADER),
    tracestate: get(TRACESTATE_HEADER),
    correlationId: get(CORRELATION_ID_HEADER),
    causationId: get(CAUSATION_ID_HEADER),
  };
}

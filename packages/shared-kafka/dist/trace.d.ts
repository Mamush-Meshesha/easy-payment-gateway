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
export declare const TRACEPARENT_HEADER = "traceparent";
export declare const TRACESTATE_HEADER = "tracestate";
export declare const CORRELATION_ID_HEADER = "correlation-id";
export declare const CAUSATION_ID_HEADER = "causation-id";
/**
 * Converts TraceHeaders into KafkaJS-compatible record header map.
 * Only defined values are included — never undefined or null headers.
 */
export declare function buildKafkaHeaders(trace: TraceHeaders): Record<string, string>;
/**
 * Extracts trace propagation headers from a Kafka message.
 * Missing headers resolve to undefined, not empty strings.
 * A failure to extract trace headers MUST NOT interrupt message processing.
 */
export declare function extractKafkaTraceHeaders(headers: Record<string, Buffer | string | null | undefined> | undefined): TraceHeaders;

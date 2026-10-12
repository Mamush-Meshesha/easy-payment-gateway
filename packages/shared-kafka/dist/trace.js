"use strict";
/**
 * Kafka Trace Propagation Helpers
 *
 * Producers inject W3C Trace Context (traceparent, tracestate) plus correlation/causation IDs
 * into Kafka record headers. Consumers extract them to continue the trace.
 *
 * IMPORTANT: No JWTs, API keys, or authentication credentials are placed in Kafka headers.
 * Kafka ACLs enforce access control independently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAUSATION_ID_HEADER = exports.CORRELATION_ID_HEADER = exports.TRACESTATE_HEADER = exports.TRACEPARENT_HEADER = void 0;
exports.buildKafkaHeaders = buildKafkaHeaders;
exports.extractKafkaTraceHeaders = extractKafkaTraceHeaders;
exports.TRACEPARENT_HEADER = 'traceparent';
exports.TRACESTATE_HEADER = 'tracestate';
exports.CORRELATION_ID_HEADER = 'correlation-id';
exports.CAUSATION_ID_HEADER = 'causation-id';
/**
 * Converts TraceHeaders into KafkaJS-compatible record header map.
 * Only defined values are included — never undefined or null headers.
 */
function buildKafkaHeaders(trace) {
    const headers = {};
    if (trace.traceparent)
        headers[exports.TRACEPARENT_HEADER] = trace.traceparent;
    if (trace.tracestate)
        headers[exports.TRACESTATE_HEADER] = trace.tracestate;
    if (trace.correlationId)
        headers[exports.CORRELATION_ID_HEADER] = trace.correlationId;
    if (trace.causationId)
        headers[exports.CAUSATION_ID_HEADER] = trace.causationId;
    return headers;
}
/**
 * Extracts trace propagation headers from a Kafka message.
 * Missing headers resolve to undefined, not empty strings.
 * A failure to extract trace headers MUST NOT interrupt message processing.
 */
function extractKafkaTraceHeaders(headers) {
    if (!headers)
        return {};
    const get = (key) => {
        const val = headers[key];
        if (val == null)
            return undefined;
        return Buffer.isBuffer(val) ? val.toString('utf-8') : val;
    };
    return {
        traceparent: get(exports.TRACEPARENT_HEADER),
        tracestate: get(exports.TRACESTATE_HEADER),
        correlationId: get(exports.CORRELATION_ID_HEADER),
        causationId: get(exports.CAUSATION_ID_HEADER),
    };
}

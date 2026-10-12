import { RecordMetadata } from 'kafkajs';
import { KafkaTLSOptions } from './client';
import { TraceHeaders } from './trace';
export declare class KafkaProducer {
    private producer;
    constructor(clientId: string, brokers: string[], tlsOptions?: KafkaTLSOptions);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Publishes a single event to a topic.
     * Trace headers (W3C traceparent, correlation-id, causation-id) are injected into
     * Kafka record headers. Business identity (JWTs, API keys) MUST NOT be passed here.
     */
    publish<T>(topic: string, event: T, traceHeaders?: TraceHeaders): Promise<RecordMetadata[]>;
    publishBatch<T>(topic: string, events: T[], traceHeaders?: TraceHeaders): Promise<RecordMetadata[]>;
}

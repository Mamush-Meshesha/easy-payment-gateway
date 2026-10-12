import { EachMessagePayload } from 'kafkajs';
import { KafkaTLSOptions } from './client';
import { TraceHeaders } from './trace';
/**
 * Enhanced message payload that gives consumers both the parsed business payload
 * and the extracted trace headers — without mixing them.
 */
export interface TracedMessagePayload<T> {
    payload: T;
    traceHeaders: TraceHeaders;
    originalMessage: EachMessagePayload;
}
export type MessageHandler<T> = (msg: TracedMessagePayload<T>) => Promise<void>;
export declare class KafkaConsumer {
    private consumer;
    constructor(clientId: string, brokers: string[], groupId: string, tlsOptions?: KafkaTLSOptions);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(topic: string, fromBeginning?: boolean): Promise<void>;
    /**
     * Starts message consumption.
     * Trace headers are extracted from Kafka record headers and provided to the handler.
     * A missing or malformed trace header MUST NOT stop processing — it resolves to an empty TraceHeaders.
     */
    start<T>(handler: MessageHandler<T>): Promise<void>;
}

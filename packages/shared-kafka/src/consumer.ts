import { Consumer, EachMessagePayload } from 'kafkajs';
import { getKafkaClient, KafkaTLSOptions } from './client';
import { TraceHeaders, extractKafkaTraceHeaders } from './trace';

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

export class KafkaConsumer {
  private consumer: Consumer;

  constructor(clientId: string, brokers: string[], groupId: string, tlsOptions?: KafkaTLSOptions) {
    const kafka = getKafkaClient(clientId, brokers, tlsOptions);
    this.consumer = kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  async subscribe(topic: string, fromBeginning: boolean = false): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning });
  }

  /**
   * Starts message consumption.
   * Trace headers are extracted from Kafka record headers and provided to the handler.
   * A missing or malformed trace header MUST NOT stop processing — it resolves to an empty TraceHeaders.
   */
  async start<T>(handler: MessageHandler<T>): Promise<void> {
    await this.consumer.run({
      eachMessage: async (msgPayload: EachMessagePayload) => {
        if (!msgPayload.message.value) return;

        const parsed = JSON.parse(msgPayload.message.value.toString()) as T;

        // Extraction failure must not affect financial correctness.
        let traceHeaders: TraceHeaders = {};
        try {
          traceHeaders = extractKafkaTraceHeaders(
            msgPayload.message.headers as Record<string, Buffer | string | null | undefined>
          );
        } catch {
          // Trace extraction failure is non-fatal. Log to observability but do not rethrow.
          console.error('Failed to extract trace headers from Kafka message; continuing processing.');
        }

        await handler({ payload: parsed, traceHeaders, originalMessage: msgPayload });
      },
    });
  }
}

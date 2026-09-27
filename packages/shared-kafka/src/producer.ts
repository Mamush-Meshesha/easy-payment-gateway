import { Producer, RecordMetadata } from 'kafkajs';
import { getKafkaClient, KafkaTLSOptions } from './client';
import { TraceHeaders, buildKafkaHeaders } from './trace';

export class KafkaProducer {
  private producer: Producer;

  constructor(clientId: string, brokers: string[], tlsOptions?: KafkaTLSOptions) {
    const kafka = getKafkaClient(clientId, brokers, tlsOptions);
    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  /**
   * Publishes a single event to a topic.
   * Trace headers (W3C traceparent, correlation-id, causation-id) are injected into
   * Kafka record headers. Business identity (JWTs, API keys) MUST NOT be passed here.
   */
  async publish<T>(
    topic: string,
    event: T,
    traceHeaders?: TraceHeaders
  ): Promise<RecordMetadata[]> {
    return this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(event),
          headers: traceHeaders ? buildKafkaHeaders(traceHeaders) : undefined,
        },
      ],
    });
  }

  async publishBatch<T>(
    topic: string,
    events: T[],
    traceHeaders?: TraceHeaders
  ): Promise<RecordMetadata[]> {
    const headers = traceHeaders ? buildKafkaHeaders(traceHeaders) : undefined;
    return this.producer.send({
      topic,
      messages: events.map((event) => ({ value: JSON.stringify(event), headers })),
    });
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducer = void 0;
const client_1 = require("./client");
const trace_1 = require("./trace");
class KafkaProducer {
    producer;
    constructor(clientId, brokers, tlsOptions) {
        const kafka = (0, client_1.getKafkaClient)(clientId, brokers, tlsOptions);
        this.producer = kafka.producer({
            allowAutoTopicCreation: false,
            transactionTimeout: 30000,
        });
    }
    async connect() {
        await this.producer.connect();
    }
    async disconnect() {
        await this.producer.disconnect();
    }
    /**
     * Publishes a single event to a topic.
     * Trace headers (W3C traceparent, correlation-id, causation-id) are injected into
     * Kafka record headers. Business identity (JWTs, API keys) MUST NOT be passed here.
     */
    async publish(topic, event, traceHeaders) {
        return this.producer.send({
            topic,
            messages: [
                {
                    value: JSON.stringify(event),
                    headers: traceHeaders ? (0, trace_1.buildKafkaHeaders)(traceHeaders) : undefined,
                },
            ],
        });
    }
    async publishBatch(topic, events, traceHeaders) {
        const headers = traceHeaders ? (0, trace_1.buildKafkaHeaders)(traceHeaders) : undefined;
        return this.producer.send({
            topic,
            messages: events.map((event) => ({ value: JSON.stringify(event), headers })),
        });
    }
}
exports.KafkaProducer = KafkaProducer;

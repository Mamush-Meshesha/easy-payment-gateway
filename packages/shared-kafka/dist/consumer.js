"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaConsumer = void 0;
const client_1 = require("./client");
const trace_1 = require("./trace");
class KafkaConsumer {
    consumer;
    constructor(clientId, brokers, groupId, tlsOptions) {
        const kafka = (0, client_1.getKafkaClient)(clientId, brokers, tlsOptions);
        this.consumer = kafka.consumer({ groupId });
    }
    async connect() {
        await this.consumer.connect();
    }
    async disconnect() {
        await this.consumer.disconnect();
    }
    async subscribe(topic, fromBeginning = false) {
        await this.consumer.subscribe({ topic, fromBeginning });
    }
    /**
     * Starts message consumption.
     * Trace headers are extracted from Kafka record headers and provided to the handler.
     * A missing or malformed trace header MUST NOT stop processing — it resolves to an empty TraceHeaders.
     */
    async start(handler) {
        await this.consumer.run({
            eachMessage: async (msgPayload) => {
                if (!msgPayload.message.value)
                    return;
                const parsed = JSON.parse(msgPayload.message.value.toString());
                // Extraction failure must not affect financial correctness.
                let traceHeaders = {};
                try {
                    traceHeaders = (0, trace_1.extractKafkaTraceHeaders)(msgPayload.message.headers);
                }
                catch {
                    // Trace extraction failure is non-fatal. Log to observability but do not rethrow.
                    console.error('Failed to extract trace headers from Kafka message; continuing processing.');
                }
                await handler({ payload: parsed, traceHeaders, originalMessage: msgPayload });
            },
        });
    }
}
exports.KafkaConsumer = KafkaConsumer;

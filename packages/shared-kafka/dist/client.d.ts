import { Kafka } from 'kafkajs';
export interface KafkaTLSOptions {
    caPath: string;
    certPath: string;
    keyPath: string;
}
export declare const getKafkaClient: (clientId: string, brokers: string[], tlsOptions?: KafkaTLSOptions) => Kafka;

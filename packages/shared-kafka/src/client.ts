import { Kafka, KafkaConfig } from 'kafkajs';
import * as fs from 'fs';

let kafkaInstance: Kafka | null = null;

export interface KafkaTLSOptions {
  caPath: string;
  certPath: string;
  keyPath: string;
}

export const getKafkaClient = (clientId: string, brokers: string[], tlsOptions?: KafkaTLSOptions): Kafka => {
  if (!kafkaInstance) {
    const config: KafkaConfig = {
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    };

    const saslUsername = process.env.KAFKA_SASL_USERNAME;
    const saslPassword = process.env.KAFKA_SASL_PASSWORD;

    if (saslUsername && saslPassword) {
      config.ssl = { rejectUnauthorized: false };
      config.sasl = {
        mechanism: 'scram-sha-256', // Aiven and Confluent typically use scram-sha-256 or plain
        username: saslUsername,
        password: saslPassword,
      };
    } else if (tlsOptions) {
      config.ssl = {
        rejectUnauthorized: true,
        ca: [fs.readFileSync(tlsOptions.caPath, 'utf-8')],
        key: fs.readFileSync(tlsOptions.keyPath, 'utf-8'),
        cert: fs.readFileSync(tlsOptions.certPath, 'utf-8'),
      };
    }

    kafkaInstance = new Kafka(config);
  }
  return kafkaInstance;
};

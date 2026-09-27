import { KafkaConsumer, TracedMessagePayload } from '@payment-gateway/shared-kafka';
import { PaymentStatusChangedEvent } from '@payment-gateway/event-schemas';
import prisma from '../dal/prisma';
import { logger } from '../utils/logger';

/**
 * Upserts the PaymentProjection read model from payment.status.changed events.
 * This is an append/upsert-only pattern — never deletes financial projections.
 */
export class PaymentProjectionConsumer {
  private consumer: KafkaConsumer;

  constructor() {
    const brokers = process.env.KAFKA_BROKERS?.split(',');
    if (!brokers || brokers.length === 0) {
      throw new Error('KAFKA_BROKERS environment variable is required');
    }
    this.consumer = new KafkaConsumer(
      'reporting-service',
      brokers,
      'reporting-service-payment-group'
    );
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe('payment.events');

    await this.consumer.start<PaymentStatusChangedEvent>(
      async (msg: TracedMessagePayload<PaymentStatusChangedEvent>) => {
        const event = msg.payload;
        const eventDate = event.timestamp ? new Date(event.timestamp) : new Date();

        await prisma.paymentProjection.upsert({
          where: { paymentId: event.paymentId },
          update: {
            status: event.status,
            lastEventAt: eventDate,
          },
          create: {
            paymentId: event.paymentId,
            merchantId: event.merchantId || 'UNKNOWN',
            merchantReference: event.merchantReference || 'UNKNOWN',
            status: event.status,
            amount: BigInt(event.amount || 0),
            currency: event.currency || 'ETB',
            createdAt: eventDate,
            lastEventAt: eventDate,
          },
        });

        logger.info('Payment projection updated', {
          paymentId: event.paymentId,
          status: event.status,
          traceId: msg.traceHeaders.traceparent,
        });
      }
    );
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}

import { KafkaConsumer, TracedMessagePayload } from '@payment-gateway/shared-kafka';
import { PaymentStatusChangedEvent } from '@payment-gateway/event-schemas';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

export class PaymentNotificationConsumer {
  private consumer: KafkaConsumer;

  constructor(private readonly notificationService: NotificationService) {
    const brokers = process.env.KAFKA_BROKERS?.split(',');
    if (!brokers || brokers.length === 0) {
      throw new Error('KAFKA_BROKERS environment variable is required');
    }

    this.consumer = new KafkaConsumer(
      'notification-service',
      brokers,
      'notification-service-payment-group'
    );
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe('payment.events');

    await this.consumer.start<PaymentStatusChangedEvent>(
      async (msg: TracedMessagePayload<PaymentStatusChangedEvent>) => {
        const event = msg.payload;

        if (event.status !== 'SUCCEEDED' && event.status !== 'FAILED') {
          return;
        }

        const templateId = event.status === 'SUCCEEDED' ? 'payment.succeeded' : 'payment.failed';
        const eventId = `${event.paymentId}:${event.status}`;
        const recipientEmail = process.env.NOTIFICATION_FALLBACK_EMAIL || 'merchant@example.com';
        const deliveryKey = `${eventId}:EMAIL:${recipientEmail}`;

        try {
          await this.notificationService.createNotification({
            eventId,
            deliveryKey,
            merchantId: event.merchantId,
            recipientEmail,
            channel: 'EMAIL',
            templateId,
            subject: event.status === 'SUCCEEDED' ? 'Payment Successful' : 'Payment Failed',
            payload: {
              paymentId: event.paymentId,
              amount: event.amount,
              currency: event.currency,
              reason: event.status === 'FAILED' ? 'Payment declined' : undefined,
            },
          });
        } catch (err: any) {
          logger.error('Failed to create notification record in DB', {
            eventId,
            paymentId: event.paymentId,
            error: err.message,
            traceId: msg.traceHeaders.traceparent,
          });
          // Rethrow ONLY database errors. Duplicate deliveryKey is handled internally.
          throw err;
        }
      }
    );

    logger.info('PaymentNotificationConsumer started');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}

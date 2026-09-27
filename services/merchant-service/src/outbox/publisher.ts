import { KafkaProducer } from '@payment-gateway/shared-kafka';
import { prisma } from '../dal/prisma';

export class OutboxPublisher {
  private producer: KafkaProducer;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.producer = new KafkaProducer('merchant-service-outbox', [process.env.KAFKA_BROKERS || 'localhost:9092']);
  }

  async start() {
    await this.producer.connect();
    this.isRunning = true;
    this.poll();
  }

  async stop() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    await this.producer.disconnect();
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      const events = await prisma.outboxEvent.findMany({
        where: { published: false },
        take: 50,
        orderBy: { createdAt: 'asc' }
      });

      if (events.length > 0) {
        for (const event of events) {
          // Send to a topic derived from event type, e.g. "merchant.events"
          const topic = event.eventType.startsWith('merchant.') ? 'merchant.events' : 'default.events';
          
          await this.producer.publish(topic, event.payload);
          
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: { published: true, publishedAt: new Date() }
          });
        }
      }
    } catch (error) {
      console.error('Error in outbox publisher', error);
    } finally {
      if (this.isRunning) {
        this.intervalId = setTimeout(() => this.poll(), 5000);
      }
    }
  }
}

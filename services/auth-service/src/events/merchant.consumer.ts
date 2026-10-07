import { KafkaConsumer } from '@payment-gateway/shared-kafka';
import { EventEnvelope, MerchantCreatedEvent } from '@payment-gateway/event-schemas';
import { prisma } from '../dal/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export class MerchantConsumer {
  private consumer: KafkaConsumer;

  constructor() {
    this.consumer = new KafkaConsumer(
      'auth-service-merchant-consumer',
      [process.env.KAFKA_BROKERS || 'localhost:9092'],
      'auth-service-merchant-group'
    );
  }

  async start() {
    await this.consumer.connect();
    await this.consumer.subscribe('merchant.events', false);

    await this.consumer.start<EventEnvelope<any>>(async (msg) => {
      const payload = msg.payload;
      
      if (!payload || !payload.eventId) {
        console.warn(`[MerchantConsumer] Received malformed event without eventId, skipping:`, payload);
        return;
      }

      // Idempotency check inside transaction
      await prisma.$transaction(async (tx) => {
        const alreadyProcessed = await tx.processedEvent.findUnique({
          where: { eventId: payload.eventId }
        });

        if (alreadyProcessed) {
          console.log(`Event ${payload.eventId} already processed, skipping.`);
          return;
        }

        if (payload.eventType === 'merchant.created') {
          await this.handleMerchantCreated(payload as EventEnvelope<MerchantCreatedEvent>, tx);
        }

        await tx.processedEvent.create({
          data: { eventId: payload.eventId }
        });
      });
    });
  }

  private async handleMerchantCreated(event: EventEnvelope<MerchantCreatedEvent>, tx: any) {
    const { email, merchantId } = event.payload;

    let user = await tx.user.findUnique({ where: { email } });

    if (!user) {
      user = await tx.user.create({
        data: {
          email,
          status: 'ACTIVE'
        }
      });

      const rawPassword = randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(rawPassword, 12);

      await tx.credential.create({
        data: {
          userId: user.id,
          passwordHash
        }
      });
    }

    let role = await tx.role.findUnique({ where: { name: 'MERCHANT_OWNER' } });
    if (!role) {
      role = await tx.role.create({
        data: {
          name: 'MERCHANT_OWNER',
          description: 'Owner of a merchant account'
        }
      });
    }

    const existingRole = await tx.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: role.id,
        merchantId
      }
    });

    if (!existingRole) {
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          merchantId
        }
      });
    }

    console.log(`Provisioned user ${email} as MERCHANT_OWNER for ${merchantId}`);
  }

  async stop() {
    await this.consumer.disconnect();
  }
}

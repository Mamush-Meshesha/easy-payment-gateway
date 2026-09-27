import { prisma } from '../dal/prisma';
import { CreateMerchantDto } from '../dtos/merchant.dto';

import { EventEnvelope, MerchantCreatedEvent } from '@payment-gateway/event-schemas';
import { randomUUID } from 'crypto';
import { provisionOwnerViaGrpc } from '../grpc/auth.client';

export class MerchantService {
  static async createMerchant(data: CreateMerchantDto) {
    return await prisma.$transaction(async (tx: any) => {
      const merchant = await tx.merchant.create({
        data: {
          legalName: data.legalName,
          displayName: data.displayName,
          country: data.country,
          defaultCurrency: data.defaultCurrency,
          status: 'ACTIVE'
        }
      });

      const eventPayload: EventEnvelope<MerchantCreatedEvent> = {
        eventId: randomUUID(),
        eventType: 'merchant.created',
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'merchant-service',
        correlationId: randomUUID(),
        payload: {
          merchantId: merchant.id,
          email: data.ownerEmail,
          legalName: data.legalName,
          createdAt: merchant.createdAt.toISOString()
        }
      };

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Merchant',
          aggregateId: merchant.id,
          eventType: eventPayload.eventType,
          payload: eventPayload as any
        }
      });

      // Try immediate synchronous provisioning for better UX.
      // If it fails, the outbox publisher will eventually deliver it.
      provisionOwnerViaGrpc(merchant.id, data.ownerEmail, data.legalName).catch(err => {
        console.error('Failed to trigger immediate gRPC provisioning', err);
      });

      return merchant;
    });
  }

  static async getMerchant(merchantId: string) {
    return await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            keyLast4: true,
            environment: true,
            keyType: true,
            status: true,
            createdAt: true,
            lastUsedAt: true,
            revokedAt: true
            // Specifically NOT selecting keyHash
          }
        },
        webhookConfigs: true,
        limits: true
      }
    });
  }

  static async getPreferences(merchantId: string) {
    let prefs = await prisma.merchantPreference.findUnique({
      where: { merchantId }
    });
    if (!prefs) {
      prefs = await prisma.merchantPreference.create({
        data: { merchantId }
      });
    }
    return prefs;
  }

  static async publishConfigUpdatedEvent(tx: any, merchantId: string) {
    // 1. Fetch latest state and increment version
    const prefs = await tx.merchantPreference.upsert({
      where: { merchantId },
      update: { version: { increment: 1 } },
      create: { merchantId, version: 1 }
    });
    
    // 2. Fetch enabled payment methods
    const methods = await tx.merchantPaymentMethod.findMany({
      where: { merchantId, isEnabled: true }
    });
    const enabledMethods = methods.map((m: any) => m.methodCode);

    // 3. Write to Outbox
    await tx.outboxEvent.create({
      data: {
        aggregateType: 'Merchant',
        aggregateId: merchantId,
        eventType: 'merchant.config_updated',
        payload: {
          merchant_id: merchantId,
          version: prefs.version,
          fee_routing: prefs.transactionFeePayer,
          enabled_payment_methods: enabledMethods,
          updated_at: new Date().toISOString()
        }
      }
    });
    return prefs;
  }

  static async updatePreferences(merchantId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      await tx.merchantPreference.upsert({
        where: { merchantId },
        update: data,
        create: {
          merchantId,
          ...data
        }
      });
      return await MerchantService.publishConfigUpdatedEvent(tx, merchantId);
    });
  }

  static async getPaymentMethods(merchantId: string) {

    return await prisma.merchantPaymentMethod.findMany({
      where: { merchantId }
    });
  }

  static async togglePaymentMethod(merchantId: string, methodCode: string, isEnabled: boolean) {
    return await prisma.$transaction(async (tx) => {
      const method = await tx.merchantPaymentMethod.upsert({
        where: { merchantId_methodCode: { merchantId, methodCode } },
        update: { isEnabled },
        create: { merchantId, methodCode, isEnabled }
      });
      await MerchantService.publishConfigUpdatedEvent(tx, merchantId);
      return method;
    });
  }
}

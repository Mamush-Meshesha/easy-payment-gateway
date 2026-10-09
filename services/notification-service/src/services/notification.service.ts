import prisma from '../dal/prisma';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export interface CreateNotificationCommand {
  eventId: string;
  deliveryKey: string;
  merchantId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: 'EMAIL' | 'SMS';
  templateId: string;
  subject?: string;
  payload: Record<string, unknown>;
}

export class NotificationService {
  constructor() {}

  async createNotification(cmd: CreateNotificationCommand): Promise<void> {
    try {
      await prisma.notificationLog.create({
        data: {
          eventId: cmd.eventId,
          deliveryKey: cmd.deliveryKey,
          merchantId: cmd.merchantId,
          recipientEmail: cmd.recipientEmail,
          recipientPhone: cmd.recipientPhone,
          channel: cmd.channel,
          templateId: cmd.templateId,
          subject: cmd.subject,
          payload: cmd.payload as any,
          status: 'PENDING',
        },
      });
      logger.info('Notification created', { deliveryKey: cmd.deliveryKey });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        logger.info('Duplicate notification event ignored (idempotent)', {
          deliveryKey: cmd.deliveryKey,
        });
        return; // Idempotent success
      }
      logger.error('Failed to persist notification', { error: err.message });
      throw err; // Database failure must not be swallowed (Kafka will retry)
    }
  }

  async getNotificationsPaginated(merchantId: string, limit: number, offset: number) {
    const [data, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notificationLog.count({
        where: { merchantId },
      }),
    ]);
    return { data, total };
  }
}

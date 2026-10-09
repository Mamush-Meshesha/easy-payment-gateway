import { Request, Response } from 'express';
import prisma from '../dal/prisma';

export class NotificationController {
  async getNotification(req: Request, res: Response) {
    const { notificationId } = req.params;
    
    // requireRole middleware populates req.user.merchantId
    const merchantId = (req as any).user?.merchantId;
    
    if (!merchantId) {
      return res.status(401).json({ error: 'Unauthorized: missing merchant context' });
    }

    const notification = await prisma.notificationLog.findUnique({
      where: { id: notificationId as string }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Tenant Isolation
    if (notification.merchantId !== merchantId) {
      return res.status(403).json({ error: 'Forbidden: notification belongs to another merchant' });
    }

    // Return safe metadata (omit payload containing potentially sensitive data like templates, and internal stack traces if they were logged)
    const safeResponse = {
      id: notification.id,
      eventId: notification.eventId,
      channel: notification.channel,
      status: notification.status,
      attemptCount: notification.attemptCount,
      nextRetryAt: notification.nextRetryAt,
      lastAttemptAt: notification.lastAttemptAt,
      deliveredAt: notification.deliveredAt,
      lastErrorCode: notification.lastErrorCode,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };

    return res.json(safeResponse);
  }
}

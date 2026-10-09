import { Router } from 'express';
import { NotificationController } from '../controller/notification.controller';
import { requireRole } from '@payment-gateway/shared-auth';

const router = Router();
const controller = new NotificationController();

// GET /api/v1/notifications/:notificationId
// Uses requireRole('MERCHANT') to enforce JWT authentication and populate req.user
router.get(
  '/:notificationId',
  requireRole(['MERCHANT']) as any,
  (req, res, next) => controller.getNotification(req, res).catch(next)
);

export default router;

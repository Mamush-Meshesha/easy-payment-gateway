import { Router } from 'express';
import { DashboardController } from '../controller/dashboard.controller';
import { WebhookReadController } from '../controller/webhook-read.controller';
import { RefundReadController } from '../controller/refund-read.controller';
import { SettlementReadController } from '../controller/settlement-read.controller';
import { NotificationReadController } from '../controller/notification-read.controller';
import { requireRole } from '@payment-gateway/shared-auth';

const router = Router();
const controller = new DashboardController();
const webhookController = new WebhookReadController();
const refundController = new RefundReadController();
const settlementController = new SettlementReadController();
const notificationController = new NotificationReadController();

router.get('/payments', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.getPayments(req, res, next)
);

router.get('/balances', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.getBalances(req, res, next)
);

router.get('/transactions', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.getTransactions(req, res, next)
);

router.get('/webhooks/deliveries', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER', 'MERCHANT_DEV']) as any, (req, res, next) =>
  webhookController.getDeliveries(req, res, next)
);

router.get('/refunds', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  refundController.getRefunds(req, res, next)
);

router.get('/settlements', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  settlementController.getSettlements(req, res, next)
);

router.get('/settlements/balance', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  settlementController.getSettlementBalance(req, res, next)
);

router.get('/notifications', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER', 'MERCHANT_DEV']) as any, (req, res, next) =>
  notificationController.getNotifications(req, res, next)
);

export default router;

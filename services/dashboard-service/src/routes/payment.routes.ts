import { Router } from 'express';
import { PaymentReadController } from '../controller/payment-read.controller';
import { DashboardController } from '../controller/dashboard.controller';
import { requireRole } from '@payment-gateway/shared-auth';

const router = Router();
const controller = new PaymentReadController();
const dashboardController = new DashboardController();

router.get('/', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  dashboardController.getPayments(req, res, next)
);

router.get('/:id', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.getPayment(req, res, next)
);

export default router;

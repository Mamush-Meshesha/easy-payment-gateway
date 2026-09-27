import { Router } from 'express';
import { ReportController } from '../controller/report.controller';
import { requireRole } from '@payment-gateway/shared-auth';

const router = Router();
const controller = new ReportController();

// All reporting endpoints require authenticated MERCHANT_OWNER, MERCHANT_ADMIN or MERCHANT_MEMBER role.
// Tenant isolation is also enforced inside the controller by reading req.user.merchantId.
router.get('/payments', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.getPayments(req, res, next)
);

router.get('/payments/export.csv', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.exportPaymentsCSV(req, res, next)
);

export default router;

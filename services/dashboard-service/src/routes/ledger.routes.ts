import { Router } from 'express';
import { LedgerReadController } from '../controller/ledger-read.controller';
import { requireRole } from '@payment-gateway/shared-auth';

const router = Router();
const controller = new LedgerReadController();

router.get('/accounts/:id/balance', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.getBalance(req, res, next)
);

router.get('/entries', requireRole(['MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_MEMBER']) as any, (req, res, next) =>
  controller.getEntries(req, res, next)
);

export default router;

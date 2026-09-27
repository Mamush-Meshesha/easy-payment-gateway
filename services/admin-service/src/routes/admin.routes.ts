import { Router } from 'express';
import { AdminController } from '../controller/admin.controller';
import { requireRole } from '@payment-gateway/shared-auth';

const router = Router();
const controller = new AdminController();

// Strictly SUPER_ADMIN only for all admin routes
router.get('/merchants', requireRole(['SUPER_ADMIN']) as any, (req, res, next) =>
  controller.listMerchants(req, res, next)
);

router.patch('/merchants/:id/suspend', requireRole(['SUPER_ADMIN']) as any, (req, res, next) =>
  controller.suspendMerchant(req, res, next)
);

router.put('/merchants/:id/limit', requireRole(['SUPER_ADMIN']) as any, (req, res, next) =>
  controller.updateMerchantLimit(req, res, next)
);

router.get('/system/health', requireRole(['SUPER_ADMIN']) as any, (req, res, next) =>
  controller.systemHealth(req, res, next)
);

// Global Providers routes
router.get('/providers', (req, res, next) =>
  controller.listProviders(req, res, next)
);

router.post('/providers', requireRole(['SUPER_ADMIN']) as any, (req, res, next) =>
  controller.createProvider(req, res, next)
);

router.put('/providers/:id', requireRole(['SUPER_ADMIN']) as any, (req, res, next) =>
  controller.updateProvider(req, res, next)
);

export default router;

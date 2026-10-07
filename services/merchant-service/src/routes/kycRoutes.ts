import { Router } from 'express';
import { kycController } from '../controllers/kycController';
import { authenticateJWT, requireRole } from '@payment-gateway/shared-auth';

const router = Router();

// Get the current KYC profile
router.get(
  '/', 
  authenticateJWT as any, 
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_DEV']) as any, 
  kycController.getProfile
);

// Submit documents to KYC profile
router.post(
  '/documents', 
  authenticateJWT as any, 
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_DEV']) as any, 
  kycController.uploadDocument
);

// Finalize KYC submission for review
router.post(
  '/submit', 
  authenticateJWT as any, 
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_DEV']) as any, 
  kycController.submitKyc
);

export { router as kycRoutes };

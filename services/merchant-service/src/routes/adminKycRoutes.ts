import { Router } from 'express';
import { adminKycController } from '../controllers/adminKycController';
import { authenticateJWT, requireRole } from '@payment-gateway/shared-auth';

const router = Router();

// All admin KYC routes require SUPER_ADMIN
const adminOnly = [authenticateJWT as any, requireRole(['SUPER_ADMIN']) as any];

// List all KYC profiles (with optional ?status= filter)
router.get('/', ...adminOnly, adminKycController.listProfiles);

// Get a single KYC profile in detail
router.get('/:profileId', ...adminOnly, adminKycController.getProfile);

// Approve a KYC profile
router.post('/:profileId/approve', ...adminOnly, adminKycController.approveProfile);

// Reject a KYC profile
router.post('/:profileId/reject', ...adminOnly, adminKycController.rejectProfile);

export { router as adminKycRoutes };

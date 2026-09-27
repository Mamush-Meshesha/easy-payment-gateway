import { Router } from 'express';
import { MerchantController } from '../controller/merchant.controller';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { CreateMerchantDto, GenerateApiKeyDto, CreateWebhookConfigDto } from '../dtos/merchant.dto';
import { authenticateJWT, requireRole } from '@payment-gateway/shared-auth';

const router = Router();

// Only SUPER_ADMIN can create new merchants globally
router.post(
  '/',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN']) as any,
  validationMiddleware(CreateMerchantDto),
  MerchantController.createMerchant
);

// API Keys
router.get(
  '/api-keys',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_DEV']) as any,
  MerchantController.getApiKeys
);

// Webhooks
router.get(
  '/webhooks',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_DEV']) as any,
  MerchantController.getWebhooks
);

// Get Merchant details (SUPER_ADMIN or specific MERCHANT_OWNER)
router.get(
  '/:merchantId',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER']) as any, // Note: requireRole will enforce req.params.id matches JWT scope for MERCHANT_OWNER
  MerchantController.getMerchant
);

// Generate API Key
router.post(
  '/:merchantId/apikeys',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER']) as any,
  validationMiddleware(GenerateApiKeyDto),
  MerchantController.generateApiKey
);

// API Keys// Revoke API Key
router.delete(
  '/:merchantId/apikeys/:keyId',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER']) as any,
  MerchantController.revokeApiKey
);

// Configure Webhook
router.post(
  '/:merchantId/webhooks',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER']) as any,
  validationMiddleware(CreateWebhookConfigDto),
  MerchantController.configureWebhook
);

// Preferences
router.get(
  '/:merchantId/preferences',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_DEV', 'MERCHANT_ADMIN']) as any,
  MerchantController.getPreferences
);

router.put(
  '/:merchantId/preferences',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_ADMIN']) as any,
  MerchantController.updatePreferences
);

// Payment Methods
router.get(
  '/:merchantId/payment-methods',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_DEV', 'MERCHANT_ADMIN']) as any,
  MerchantController.getPaymentMethods
);

router.patch(
  '/:merchantId/payment-methods/:methodCode',
  authenticateJWT as any,
  requireRole(['SUPER_ADMIN', 'MERCHANT_OWNER', 'MERCHANT_ADMIN']) as any,
  MerchantController.togglePaymentMethod
);

export default router;

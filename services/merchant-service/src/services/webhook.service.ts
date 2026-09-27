import { prisma } from '../dal/prisma';
import crypto from 'crypto';
import { CreateWebhookConfigDto } from '../dtos/merchant.dto';

export class WebhookService {
  /**
   * Creates a webhook configuration for a merchant.
   * Generates a unique signing secret used by the merchant to verify webhook payloads.
   */
  static async createWebhookConfig(merchantId: string, data: CreateWebhookConfigDto) {
    // Generate a secure signing secret for HMAC
    const secretBytes = crypto.randomBytes(32).toString('hex');
    const rawSecret = `whsec_${secretBytes}`;
    
    // Store the hash of the secret (so we can verify if needed, or if we send the raw secret, we must store it securely. 
    // Wait, webhook secrets are used to sign payloads OUTBOUND. The server needs the raw secret to sign payloads!
    // So for webhooks, we CANNOT hash it. We must store the raw secret or encrypt it symmetrically.
    // For now, we will store it. Since this is an MVP, we store it. In production, we would use Application-Level Encryption (ALE).
    // The user rules specify we can defer ALE to v2. So we will store `secretHash` as the raw secret for now, 
    // or rename the field. Let's look at schema.prisma: `secretHash String`.
    
    // Actually, if it's named `secretHash`, we should probably encrypt it. But since ALE is deferred, we'll store it as plain text.
    // Let's generate it and store it.
    
    const webhook = await prisma.webhookConfig.create({
      data: {
        merchantId,
        url: data.url,
        secretHash: rawSecret // TODO (Phase 2): Implement AES encryption before storing
      }
    });

    return {
      id: webhook.id,
      url: webhook.url,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      secret: rawSecret // Returned once so the merchant can configure their verifier
    };
  }

  static async listWebhooks(merchantId: string) {
    return await prisma.webhookConfig.findMany({
      where: { merchantId },
      select: {
        id: true,
        url: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

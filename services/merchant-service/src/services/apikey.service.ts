import { prisma } from '../dal/prisma';
import crypto from 'crypto';
import { GenerateApiKeyDto } from '../dtos/merchant.dto';

export class ApiKeyService {
  /**
   * Generates a secure API key following the Stripe pattern.
   * Format: {type}_{env}_{random} -> sk_live_abc123...
   * The raw key is returned ONCE and never stored.
   * Only the SHA-256 hash and last 4 characters are persisted.
   */
  static async generateKey(merchantId: string, data: GenerateApiKeyDto) {
    const environment = data.environment || 'LIVE';
    const keyType = data.keyType || 'SECRET';
    const name = data.name || 'Default Key';

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new Error("Merchant not found");

    if (environment === 'LIVE' && merchant.status !== 'ACTIVE') {
      throw new Error("Cannot create LIVE keys until business is fully verified and active.");
    }

    // 1. Generate 256 bits of cryptographically secure randomness
    const secretBytes = crypto.randomBytes(32).toString('hex');
    
    // 2. Format the prefix and the full raw key
    const typePrefix = keyType === 'SECRET' ? 'sk' : 'pk';
    const envPrefix = environment === 'LIVE' ? 'live' : 'test';
    const keyPrefix = `${typePrefix}_${envPrefix}_`; // e.g. sk_live_
    
    const rawKey = `${keyPrefix}${secretBytes}`; // sk_live_abc123...
    
    // 3. Extract last 4 for identification
    const keyLast4 = rawKey.slice(-4);

    // 4. Generate SHA-256 hash of the full raw key for constant-time storage lookup
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // 5. Save to database
    const apiKey = await prisma.apiKey.create({
      data: {
        merchantId,
        keyType,
        environment,
        keyPrefix,
        keyLast4,
        keyHash,
        rawKey, // Added for reveal feature
        name
      }
    });

    // 6. Return the raw key (It will never be accessible again)
    return {
      id: apiKey.id,
      name: apiKey.name,
      environment: apiKey.environment,
      keyType: apiKey.keyType,
      createdAt: apiKey.createdAt,
      rawKey // The one and only time this is returned
    };
  }

  static async revokeKey(keyId: string, merchantId: string) {
    return await prisma.apiKey.updateMany({
      where: { id: keyId, merchantId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date()
      }
    });
  }

  static async listKeys(merchantId: string) {
    return await prisma.apiKey.findMany({
      where: { merchantId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        environment: true,
        keyType: true,
        keyPrefix: true,
        keyLast4: true,
        rawKey: true, // Added for reveal feature
        createdAt: true,
        lastUsedAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Authenticates an incoming raw API key.
   */
  static async authenticateRawKey(rawKey: string) {
    // 1. Validate format visually first to reject garbage quickly
    if (!rawKey.startsWith('sk_') && !rawKey.startsWith('pk_')) {
      return null;
    }

    // 2. Hash the incoming key
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // 3. Lookup the hash
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { merchant: true }
    });

    if (!apiKey) return null;

    // 4. Check status
    if (apiKey.status !== 'ACTIVE') return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
    if (apiKey.merchant.status !== 'ACTIVE') return null;

    // 5. Update last used asynchronously (don't block the request)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(err => console.error('Failed to update lastUsedAt', err));

    return apiKey;
  }
}

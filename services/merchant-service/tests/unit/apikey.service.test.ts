import { ApiKeyService } from '../../src/services/apikey.service';
import { prisma } from '../../src/dal/prisma';
import crypto from 'crypto';
import { GenerateApiKeyDto } from '../../src/dtos/merchant.dto';

jest.mock('../../src/dal/prisma', () => ({
  prisma: {
    apiKey: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn().mockReturnValue(Promise.resolve({})), updateMany: jest.fn() }
  }
}));

describe('ApiKeyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateKey', () => {
    it('should generate a secure key and hash it before saving', async () => {
      const dto: GenerateApiKeyDto = { environment: 'LIVE', keyType: 'SECRET' };
      const merchantId = 'merch-1';
      
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-1',
        environment: 'LIVE',
        keyType: 'SECRET',
        createdAt: new Date()
      });

      const result = await ApiKeyService.generateKey(merchantId, dto);

      expect(result).toHaveProperty('rawKey');
      expect(result.rawKey).toMatch(/^sk_live_[a-f0-9]{64}$/); // rawKey should have 64 hex chars
      
      // Ensure it was saved properly
      expect(prisma.apiKey.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          merchantId: 'merch-1',
          keyPrefix: 'sk_live_',
          environment: 'LIVE',
          keyType: 'SECRET'
        })
      }));
    });
  });

  describe('authenticateRawKey', () => {
    it('should authenticate a valid key', async () => {
      const rawKey = 'sk_live_abc123';
      const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-1',
        status: 'ACTIVE',
        merchant: { status: 'ACTIVE' }
      });

      const result = await ApiKeyService.authenticateRawKey(rawKey);
      
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { keyHash: hash },
        include: { merchant: true }
      });
      expect(result).not.toBeNull();
    });

    it('should reject a revoked key', async () => {
      const rawKey = 'sk_live_abc123';

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-1',
        status: 'REVOKED',
        merchant: { status: 'ACTIVE' }
      });

      const result = await ApiKeyService.authenticateRawKey(rawKey);
      expect(result).toBeNull();
    });
  });
});

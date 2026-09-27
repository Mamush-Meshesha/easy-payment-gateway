import request from 'supertest';
import app from '../../src/app';
import { generateAccessToken } from '@payment-gateway/shared-auth';
import { prisma } from '../../src/dal/prisma';
import { MerchantService } from '../../src/services/merchant.service';

jest.mock('../../src/dal/prisma', () => ({
  prisma: {
    merchant: { create: jest.fn(), findUnique: jest.fn() }
  }
}));

jest.mock('../../src/services/merchant.service', () => ({
  MerchantService: {
    createMerchant: jest.fn(),
    getMerchant: jest.fn()
  }
}));

describe('Merchant E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/merchants', () => {
    it('should reject if no token provided', async () => {
      const res = await request(app).post('/api/v1/merchants').send({});
      expect(res.status).toBe(401);
    });

    it('should reject if user is not SUPER_ADMIN', async () => {
      const token = generateAccessToken({ userId: 'user-1', roles: [{ role: 'MERCHANT_OWNER', merchantId: 'm1' }] });
      const res = await request(app)
        .post('/api/v1/merchants')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('should create merchant if user is SUPER_ADMIN and payload is valid', async () => {
      const token = generateAccessToken({ userId: 'admin', roles: [{ role: 'SUPER_ADMIN' }] });
      const payload = {
        legalName: 'New Merchant',
        displayName: 'New Merchant Store',
        country: 'US',
        defaultCurrency: 'USD',
        ownerEmail: 'owner@merchant.com'
      };
      
      (MerchantService.createMerchant as jest.Mock).mockResolvedValue({ id: 'new-merch', ...payload });

      const res = await request(app)
        .post('/api/v1/merchants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
        
      expect(res.status).toBe(201);
      expect(res.body.id).toBe('new-merch');
    });
  });

  describe('GET /api/v1/merchants/:id', () => {
    it('should allow MERCHANT_OWNER to access their own merchant data', async () => {
      const token = generateAccessToken({ userId: 'owner', roles: [{ role: 'MERCHANT_OWNER', merchantId: 'm1' }] });
      
      (MerchantService.getMerchant as jest.Mock).mockResolvedValue({ id: 'm1', displayName: 'ACME' });

      const res = await request(app)
        .get('/api/v1/merchants/m1')
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(res.body.displayName).toBe('ACME');
    });

    it('should forbid MERCHANT_OWNER from accessing another merchant', async () => {
      const token = generateAccessToken({ userId: 'owner', roles: [{ role: 'MERCHANT_OWNER', merchantId: 'm1' }] });
      
      const res = await request(app)
        .get('/api/v1/merchants/m2')
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.status).toBe(403);
    });
  });
});

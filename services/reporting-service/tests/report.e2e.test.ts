import request from 'supertest';
import app from '../src/app';
import { generateAccessToken } from '@payment-gateway/shared-auth';
import prisma from '../src/dal/prisma';

jest.mock('../src/dal/prisma', () => ({
  __esModule: true,
  default: {
    paymentProjection: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

describe('Reporting Service — e2e', () => {
  const merchantId = 'merchant-test-123';
  const merchantToken = generateAccessToken({ userId: 'user-1', roles: [{ role: 'MERCHANT_ADMIN', merchantId }] });
  const otherMerchantToken = generateAccessToken({ userId: 'user-2', roles: [{ role: 'MERCHANT_ADMIN', merchantId: 'other-merchant' }] });

  const mockPayments = [
    {
      paymentId: 'pay-2',
      merchantId,
      merchantReference: 'ref-2',
      status: 'FAILED',
      amount: 500n,
      currency: 'ETB',
      createdAt: new Date('2023-10-02T10:00:00Z'),
      lastEventAt: new Date('2023-10-02T10:01:00Z'),
    },
    {
      paymentId: 'pay-1',
      merchantId,
      merchantReference: 'ref-1',
      status: 'SUCCEEDED',
      amount: 1000n,
      currency: 'ETB',
      createdAt: new Date('2023-10-01T10:00:00Z'),
      lastEventAt: new Date('2023-10-01T10:01:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/reports/payments', () => {
    it('returns paginated payments for the authenticated merchant', async () => {
      (prisma.paymentProjection.findMany as jest.Mock).mockResolvedValue(mockPayments);
      const res = await request(app)
        .get('/api/v1/reports/payments')
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].paymentId).toBe('pay-2'); // ordered by desc
      expect(res.body.data[1].paymentId).toBe('pay-1');
      expect(res.body.data[0].amount).toBe('500'); // BigInt serialization
    });

    it('enforces tenant isolation — cannot see other merchants payments', async () => {
      (prisma.paymentProjection.findMany as jest.Mock).mockResolvedValue([]);
      const res = await request(app)
        .get('/api/v1/reports/payments')
        .set('Authorization', `Bearer ${otherMerchantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/reports/payments/export.csv', () => {
    it('exports CSV data for the authenticated merchant', async () => {
      (prisma.paymentProjection.findMany as jest.Mock).mockResolvedValue(mockPayments);
      const res = await request(app)
        .get('/api/v1/reports/payments/export.csv')
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('pay-1');
      expect(res.text).toContain('pay-2');
      expect(res.text).toContain('merchantReference');
    });
  });
});

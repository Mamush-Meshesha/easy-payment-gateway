import request from 'supertest';
import app from '../src/app';
import { generateAccessToken } from '@payment-gateway/shared-auth';

describe('Dashboard Service — Tenant Isolation', () => {
  const merchantAToken = generateAccessToken({ userId: 'user-1', roles: [{ role: 'MERCHANT_ADMIN', merchantId: 'merchant-A' }] });
  const noMerchantToken = generateAccessToken({ userId: 'user-2', roles: [{ role: 'MERCHANT_MEMBER' }] });

  it('GET /api/v1/dashboard/payments — allows authenticated merchant user', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/payments')
      .set('Authorization', `Bearer ${merchantAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.merchantId).toBe('merchant-A');
    expect(res.body.contextBuilt).toBe(true);
  });

  it('GET /api/v1/dashboard/payments — rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/dashboard/payments');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/dashboard/balances — rejects user with no merchantId in token', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/balances')
      .set('Authorization', `Bearer ${noMerchantToken}`);

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/dashboard/transactions — allows merchant user', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/transactions')
      .set('Authorization', `Bearer ${merchantAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.merchantId).toBe('merchant-A');
  });
});

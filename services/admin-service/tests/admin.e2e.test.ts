import request from 'supertest';
import app from '../src/app';
import { generateAccessToken } from '@payment-gateway/shared-auth';

describe('Admin Service — Authorization', () => {
  const superAdminToken = generateAccessToken({ userId: 'admin-1', roles: [{ role: 'SUPER_ADMIN' }] });
  const merchantToken = generateAccessToken({ userId: 'user-1', roles: [{ role: 'MERCHANT_ADMIN', merchantId: 'merchant-A' }] });

  it('GET /api/v1/admin/merchants — allows SUPER_ADMIN', async () => {
    const res = await request(app)
      .get('/api/v1/admin/merchants')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/v1/admin/merchants — blocks MERCHANT_ADMIN (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/merchants')
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/v1/admin/merchants — blocks unauthenticated (401)', async () => {
    const res = await request(app).get('/api/v1/admin/merchants');
    expect(res.status).toBe(401);
  });
});

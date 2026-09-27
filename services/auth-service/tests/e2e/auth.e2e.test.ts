import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/dal/prisma';
import { AuthService } from '../../src/services/auth.service';

jest.mock('../../src/dal/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() }
  }
}));

jest.mock('../../src/services/auth.service', () => ({
  AuthService: {
    login: jest.fn()
  }
}));

describe('Auth Routes E2E (Mocked Service)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should fail validation with missing fields', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should fail validation with weak password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'short'
      });
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('Password must be at least 8 characters long');
    });

    it('should call login service on valid request', async () => {
      (AuthService.login as jest.Mock).mockResolvedValue({ accessToken: 'token', refreshToken: 'ref' });
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'longpassword123'
      });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe('token');
    });
  });
});

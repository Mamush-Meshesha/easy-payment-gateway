import { AuthService } from '../../src/services/auth.service';
import { prisma } from '../../src/dal/prisma';
import { comparePassword, hashPassword } from '../../src/utils/password.util';
import { generateRefreshToken, verifyAndConsumeRefreshToken } from '../../src/utils/redis.util';

jest.mock('../../src/dal/prisma', () => ({
  prisma: {
    userRole: { count: jest.fn() },
    role: { upsert: jest.fn() },
    user: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() }
  }
}));

jest.mock('../../src/utils/password.util', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn()
}));

jest.mock('../../src/utils/redis.util', () => ({
  generateRefreshToken: jest.fn(),
  verifyAndConsumeRefreshToken: jest.fn()
}));

describe('AuthService Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(AuthService.login({ email: 'fake@example.com', password: 'pass' })).rejects.toThrow('Invalid email or password');
    });

    it('should throw if user is inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', status: 'SUSPENDED', credentials: {}
      });
      await expect(AuthService.login({ email: 'fake@example.com', password: 'pass' })).rejects.toThrow('User account is not active');
    });

    it('should throw if password mismatch', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', status: 'ACTIVE', credentials: { passwordHash: 'hash' }
      });
      (comparePassword as jest.Mock).mockResolvedValue(false);
      await expect(AuthService.login({ email: 'fake@example.com', password: 'wrong' })).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refresh', () => {
    it('should throw if invalid or expired token', async () => {
      (verifyAndConsumeRefreshToken as jest.Mock).mockResolvedValue(null);
      await expect(AuthService.refresh('bad-token')).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw if user is inactive during refresh', async () => {
      (verifyAndConsumeRefreshToken as jest.Mock).mockResolvedValue('user-1');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', status: 'SUSPENDED' });
      await expect(AuthService.refresh('good-token')).rejects.toThrow('User inactive or not found');
    });
  });

  describe('registerInitialAdmin', () => {
    it('should throw if admin already exists', async () => {
      (prisma.userRole.count as jest.Mock).mockResolvedValue(1);
      await expect(AuthService.registerInitialAdmin({ email: 'admin@system.com', password: 'pass' })).rejects.toThrow('Initial SUPER_ADMIN already exists.');
    });
  });
});

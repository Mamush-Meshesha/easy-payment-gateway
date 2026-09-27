import { prisma } from '../dal/prisma';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, JwtPayload } from '@payment-gateway/shared-auth';
import { generateRefreshToken, verifyAndConsumeRefreshToken } from '../utils/redis.util';
import { LoginDto, RegisterInitialAdminDto, RegisterMerchantDto } from '../dtos/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { provisionMerchantViaGrpc } from './merchant.client';

export class AuthService {
  static async registerInitialAdmin(data: RegisterInitialAdminDto) {
    const existingAdmins = await prisma.userRole.count({
      where: { role: { name: 'SUPER_ADMIN' } }
    });

    if (existingAdmins > 0) {
      throw new Error('Initial SUPER_ADMIN already exists.');
    }

    const hashedPassword = await hashPassword(data.password);

    // Ensure SUPER_ADMIN role exists
    const adminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Global Administrator' }
    });

    const user = await prisma.user.create({
      data: {
        email: data.email,
        credentials: {
          create: {
            passwordHash: hashedPassword
          }
        },
        roles: {
          create: {
            roleId: adminRole.id
          }
        }
      },
      include: { roles: { include: { role: true } } }
    });

    return user;
  }
  static async registerMerchant(data: RegisterMerchantDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email is already in use');
    }

    const hashedPassword = await hashPassword(data.password);
    const merchantId = uuidv4();

    const merchantRole = await prisma.role.upsert({
      where: { name: 'MERCHANT_OWNER' },
      update: {},
      create: { name: 'MERCHANT_OWNER', description: 'Merchant Owner' }
    });

    const user = await prisma.user.create({
      data: {
        email: data.email,
        credentials: {
          create: {
            passwordHash: hashedPassword
          }
        },
        roles: {
          create: {
            roleId: merchantRole.id,
            merchantId: merchantId
          }
        }
      },
      include: { roles: { include: { role: true } } }
    });

    // Call merchant-service synchronously via gRPC to provision the Merchant aggregate.
    // This enforces architectural integrity: merchant-service is the source of truth for Merchant profiles.
    try {
      await provisionMerchantViaGrpc(merchantId, data.email, (data as any).businessName || 'Merchant Business');
    } catch (err: any) {
      console.error('Failed to provision merchant in merchant-service:', err);
      // Depending on strictness, we might want to throw here and rollback, 
      // but prisma transaction doesn't wrap gRPC cleanly without 2PC.
      // For now, we will log the error. The system will rely on manual retry or a DLQ in production.
    }

    const rolesPayload = user.roles.map(ur => ({
      role: ur.role.name,
      merchantId: ur.merchantId
    }));

    const jwtPayload: JwtPayload = {
      userId: user.id,
      roles: rolesPayload
    };

    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = await generateRefreshToken(user.id);

    return { 
      accessToken, 
      refreshToken, 
      user: { 
        id: user.id, 
        email: user.email, 
        roles: rolesPayload 
      } 
    };
  }

  static async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        credentials: true,
        roles: { include: { role: true } }
      }
    });

    if (!user || !user.credentials) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('User account is not active');
    }

    const isMatch = await comparePassword(data.password, user.credentials.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const rolesPayload = user.roles.map(ur => ({
      role: ur.role.name,
      merchantId: ur.merchantId
    }));

    const payload: JwtPayload = {
      userId: user.id,
      roles: rolesPayload
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, roles: rolesPayload } };
  }

  static async refresh(refreshToken: string) {
    const userId = await verifyAndConsumeRefreshToken(refreshToken);
    if (!userId) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new Error('User inactive or not found');
    }

    const rolesPayload = user.roles.map(ur => ({
      role: ur.role.name,
      merchantId: ur.merchantId
    }));

    const payload: JwtPayload = {
      userId: user.id,
      roles: rolesPayload
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = await generateRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}

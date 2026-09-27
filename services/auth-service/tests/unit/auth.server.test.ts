import { startGrpcServer } from '../../src/grpc/auth.server';
import { prisma } from '../../src/dal/prisma';
import bcrypt from 'bcryptjs';

// We need to extract the actual implementation logic from the class that is added to the server.
// Since we don't export the class itself, we can test it by instantiating the class by requiring the module,
// but wait, we only export `startGrpcServer`. Let's mock grpc.Server and capture the implementation.

jest.mock('@grpc/grpc-js', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      addService: jest.fn(),
      bindAsync: jest.fn()
    })),
    ServerCredentials: {
      createInsecure: jest.fn()
    }
  };
});

jest.mock('../../src/dal/prisma', () => ({
  prisma: {
    $transaction: jest.fn()
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password')
}));

describe('Auth gRPC Server', () => {
  let authServiceImpl: any;

  beforeAll(() => {
    // Require the module which calls the mocks
    const grpc = require('@grpc/grpc-js');
    const authServerMod = require('../../src/grpc/auth.server');
    
    // We can instantiate the server by calling startGrpcServer to capture the passed implementation
    authServerMod.startGrpcServer();
    
    const serverMockInstance = grpc.Server.mock.results[0].value;
    authServiceImpl = serverMockInstance.addService.mock.calls[0][1];
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provision a new owner successfully', async () => {
    const mockRequest = {
      request: { email: 'new@test.com', merchantId: 'merch-123' }
    };
    const mockCallback = jest.fn();

    // Mock Prisma transaction to simulate successful creation
    (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
      // Create a mock tx object
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'user-1' })
        },
        credential: {
          create: jest.fn().mockResolvedValue({})
        },
        role: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'role-1' })
        },
        userRole: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({})
        }
      };
      return await cb(tx);
    });

    await authServiceImpl.provisionMerchantOwner(mockRequest, mockCallback);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(null, { success: true, userId: 'user-1', error: '' });
  });

  it('should reuse existing user and role if they already exist', async () => {
    const mockRequest = {
      request: { email: 'existing@test.com', merchantId: 'merch-456' }
    };
    const mockCallback = jest.fn();

    (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'user-2' }),
          create: jest.fn()
        },
        credential: {
          create: jest.fn()
        },
        role: {
          findUnique: jest.fn().mockResolvedValue({ id: 'role-2' }),
          create: jest.fn()
        },
        userRole: {
          findFirst: jest.fn().mockResolvedValue({ id: 'ur-1' }),
          create: jest.fn()
        }
      };
      return await cb(tx);
    });

    await authServiceImpl.provisionMerchantOwner(mockRequest, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, { success: true, userId: 'user-2', error: '' });
  });

  it('should handle errors thrown during transaction', async () => {
    const mockRequest = {
      request: { email: 'fail@test.com', merchantId: 'merch-789' }
    };
    const mockCallback = jest.fn();

    (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB connection failed'));

    await authServiceImpl.provisionMerchantOwner(mockRequest, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, { success: false, userId: '', error: 'DB connection failed' });
  });
});

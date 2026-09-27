import { provisionOwnerViaGrpc, authClient } from '../../src/grpc/auth.client';

jest.mock('@payment-gateway/protobuf', () => {
  return {
    AuthProto: {
      AuthServiceClient: jest.fn().mockImplementation(() => ({
        provisionMerchantOwner: jest.fn()
      }))
    }
  };
});

describe('authClient (gRPC)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true on successful provisioning', async () => {
    (authClient.provisionMerchantOwner as jest.Mock).mockImplementation((req, callback) => {
      callback(null, { success: true, error: '' });
    });

    const result = await provisionOwnerViaGrpc('merch-123', 'owner@test.com', 'Acme Corp');
    
    expect(authClient.provisionMerchantOwner).toHaveBeenCalledWith(
      { merchantId: 'merch-123', email: 'owner@test.com', legalName: 'Acme Corp' },
      expect.any(Function)
    );
    expect(result).toBe(true);
  });

  it('should return false if gRPC service returns an error', async () => {
    (authClient.provisionMerchantOwner as jest.Mock).mockImplementation((req, callback) => {
      callback(new Error('Network error'), null);
    });

    const result = await provisionOwnerViaGrpc('merch-123', 'owner@test.com', 'Acme Corp');
    expect(result).toBe(false);
  });

  it('should return false if response.success is false', async () => {
    (authClient.provisionMerchantOwner as jest.Mock).mockImplementation((req, callback) => {
      callback(null, { success: false, error: 'User suspended' });
    });

    const result = await provisionOwnerViaGrpc('merch-123', 'owner@test.com', 'Acme Corp');
    expect(result).toBe(false);
  });
});

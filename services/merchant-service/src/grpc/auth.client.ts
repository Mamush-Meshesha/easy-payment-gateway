import * as grpc from '@grpc/grpc-js';
import { AuthProto } from '@payment-gateway/protobuf';

const port = process.env.AUTH_GRPC_PORT || 50051;
const host = process.env.AUTH_SERVICE_HOST || 'localhost';

export const authClient = new AuthProto.AuthServiceClient(
  `${host}:${port}`,
  grpc.credentials.createInsecure()
);

export const provisionOwnerViaGrpc = (merchantId: string, email: string, legalName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    authClient.provisionMerchantOwner(
      { merchantId, email, legalName },
      (error: grpc.ServiceError | null, response: AuthProto.ProvisionResponse) => {
        if (error) {
          console.error('[gRPC Client] Error provisioning owner', error.message);
          return resolve(false);
        }
        if (!response.success) {
          console.error('[gRPC Client] Provisioning returned failure:', response.error);
          return resolve(false);
        }
        resolve(true);
      }
    );
  });
};

import * as grpc from '@grpc/grpc-js';
import { AuthProto } from '@payment-gateway/protobuf';
import { prisma } from '../dal/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

class AuthServiceImpl implements AuthProto.AuthServiceServer {
  [name: string]: grpc.UntypedHandleCall;

  async provisionMerchantOwner(
    call: grpc.ServerUnaryCall<AuthProto.ProvisionRequest, AuthProto.ProvisionResponse>,
    callback: grpc.sendUnaryData<AuthProto.ProvisionResponse>
  ) {
    const { email, merchantId } = call.request;

    try {
      const user = await prisma.$transaction(async (tx) => {
        let u = await tx.user.findUnique({ where: { email } });
        if (!u) {
          u = await tx.user.create({ data: { email, status: 'ACTIVE' } });
          const rawPassword = randomBytes(16).toString('hex');
          const passwordHash = await bcrypt.hash(rawPassword, 12);
          await tx.credential.create({ data: { userId: u.id, passwordHash } });
        }

        let role = await tx.role.findUnique({ where: { name: 'MERCHANT_OWNER' } });
        if (!role) {
          role = await tx.role.create({
            data: { name: 'MERCHANT_OWNER', description: 'Owner of a merchant account' }
          });
        }

        const existingRole = await tx.userRole.findFirst({
          where: { userId: u.id, roleId: role.id, merchantId }
        });

        if (!existingRole) {
          await tx.userRole.create({
            data: { userId: u.id, roleId: role.id, merchantId }
          });
        }
        
        return u;
      });

      console.log(`[gRPC] Provisioned user ${email} as MERCHANT_OWNER for ${merchantId}`);
      callback(null, { success: true, userId: user.id, error: '' });
    } catch (error: any) {
      console.error(`[gRPC] Failed to provision owner: ${error.message}`);
      callback(null, { success: false, userId: '', error: error.message });
    }
  }
}

export const startGrpcServer = () => {
  const server = new grpc.Server();
  server.addService(AuthProto.AuthServiceService, new AuthServiceImpl());

  const port = process.env.GRPC_PORT || 50051;
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error: Error | null, port: number) => {
      if (error) {
        console.error('Failed to bind gRPC server', error);
        return;
      }
      console.log(`Auth gRPC server listening on port ${port}`);
    }
  );
};

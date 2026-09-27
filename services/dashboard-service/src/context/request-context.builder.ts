/**
 * Dashboard Service — BFF (Backend-for-Frontend) for merchant UI.
 *
 * RESPONSIBILITIES:
 *   - Authenticate the external user via JWT (shared-auth)
 *   - Build an internal RequestContext from the verified JWT
 *   - Call downstream services via mTLS gRPC, passing the RequestContext in metadata
 *   - Aggregate/shape responses for the frontend
 *
 * BOUNDARIES:
 *   - MUST NOT query other service databases directly
 *   - MUST NOT trust merchant_id from HTTP headers or query parameters
 *   - Tenant isolation is a dual responsibility: this service builds the context,
 *     downstream services enforce it via RequireMerchant()
 */

import * as grpc from '@grpc/grpc-js';
import {
  serializeRequestContext,
  REQUEST_CONTEXT_METADATA_KEY,
} from 'ts-grpc-auth';
import { RequestContext } from '@payment-gateway/protobuf/dist/generated/context';
import { JwtPayload } from '@payment-gateway/shared-auth';

export function buildRequestContext(
  user: JwtPayload,
  environment: string,
  callerService: string = 'dashboard-service'
): grpc.Metadata {
  const merchantId = user.roles.find(r => r.merchantId)?.merchantId || '';

  const ctx: RequestContext = {
    subjectId: user.userId,
    merchantId: merchantId,
    roles: user.roles.map(r => r.role),
    permissions: [],
    sessionId: '',
    authType: 'USER',
    callerService,
    contextVersion: 1,
    environment,
  };

  const md = new grpc.Metadata();
  md.set(REQUEST_CONTEXT_METADATA_KEY, serializeRequestContext(ctx));
  return md;
}

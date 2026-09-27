import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import { TLSSocket } from 'tls';
import { RequestContext } from '@payment-gateway/protobuf/dist/generated/context';

export { RequestContext } from '@payment-gateway/protobuf/dist/generated/context';

export interface Identity {
  environment: string;
  serviceName: string;
}

export type PolicyFunc = (identity: Identity, fullMethod: string) => boolean;

// ─── Context Metadata Key ───────────────────────────────────────────────────
export const REQUEST_CONTEXT_METADATA_KEY = 'x-request-context';

/**
 * Serializes a RequestContext into a base64-encoded JSON string to inject into gRPC metadata.
 */
export function serializeRequestContext(ctx: RequestContext): string {
  const json = JSON.stringify(RequestContext.toJSON(ctx));
  return Buffer.from(json).toString('base64');
}

/**
 * Deserializes a RequestContext from a base64-encoded JSON string in gRPC metadata.
 * Returns null if not present.
 */
export function deserializeRequestContext(metadata: grpc.Metadata): RequestContext | null {
  const vals = metadata.get(REQUEST_CONTEXT_METADATA_KEY);
  if (!vals || vals.length === 0) {
    return null;
  }
  const raw = vals[0] as string;
  const decoded = Buffer.from(raw, 'base64').toString('utf-8');
  return RequestContext.fromJSON(JSON.parse(decoded));
}

/**
 * Business Authorization helper.
 * Enforces tenant isolation: USER context MUST match the targetMerchantId.
 */
export function requireMerchant(reqCtx: RequestContext | null, targetMerchantId: string): void {
  if (!reqCtx) {
    throw Object.assign(new Error('Missing request context for business authorization'), {
      code: grpc.status.INTERNAL,
    });
  }
  if (reqCtx.authType === 'USER') {
    if (reqCtx.merchantId !== targetMerchantId) {
      throw Object.assign(
        new Error(`Unauthorized tenant access: user belongs to merchant ${reqCtx.merchantId}, requested ${targetMerchantId}`),
        { code: grpc.status.PERMISSION_DENIED }
      );
    }
  }
}

// ─── Identity ────────────────────────────────────────────────────────────────

/**
 * Extracts SPIFFE identity from a gRPC call.
 */
export function extractIdentity(call: grpc.ServerUnaryCall<any, any>): Identity {
  const socket = (call as any).call?.stream?.session?.socket as TLSSocket | undefined;
  if (!socket) {
    throw new Error('TLS socket not found in request context. Is mTLS enabled?');
  }

  const cert = socket.getPeerCertificate();
  if (!cert || Object.keys(cert).length === 0) {
    throw new Error('Client certificate not found');
  }

  const san = cert.subjectaltname;
  if (!san) {
    throw new Error('No Subject Alternative Name (SAN) found in certificate');
  }

  const uris = san.split(', ').filter(s => s.startsWith('URI:spiffe://'));
  if (uris.length === 0) {
    throw new Error('No SPIFFE URI found in certificate SAN');
  }
  if (uris.length > 1) {
    throw new Error('Multiple SPIFFE URIs found in certificate');
  }

  const spiffeUri = uris[0].replace('URI:', '');
  const url = new URL(spiffeUri);

  if (url.hostname !== 'payment-gateway') {
    throw new Error(`Invalid SPIFFE trust domain: ${url.hostname}`);
  }

  const parts = url.pathname.replace(/^\/|\/$/g, '').split('/');
  if (parts.length !== 4 || parts[0] !== 'ns' || parts[2] !== 'sa') {
    throw new Error(`Invalid SPIFFE path format: ${url.pathname}`);
  }

  return {
    environment: parts[1],
    serviceName: parts[3]
  };
}

// ─── TLS Credential Factories ─────────────────────────────────────────────────

export function createServerCredentials(caCertPath: string, serverCertPath: string, serverKeyPath: string): grpc.ServerCredentials {
  const caCert = fs.readFileSync(caCertPath);
  const serverCert = fs.readFileSync(serverCertPath);
  const serverKey = fs.readFileSync(serverKeyPath);

  return grpc.ServerCredentials.createSsl(caCert, [{
    cert_chain: serverCert,
    private_key: serverKey
  }], true);
}

export function createClientCredentials(caCertPath: string, clientCertPath: string, clientKeyPath: string): grpc.ChannelCredentials {
  const caCert = fs.readFileSync(caCertPath);
  const clientCert = fs.readFileSync(clientCertPath);
  const clientKey = fs.readFileSync(clientKeyPath);

  return grpc.credentials.createSsl(caCert, clientKey, clientCert);
}

// ─── Interceptor ─────────────────────────────────────────────────────────────

export function applyAuthInterceptor<ReqT, ResT>(
  handler: grpc.handleUnaryCall<ReqT, ResT>,
  policy: PolicyFunc,
  fullMethod: string
): grpc.handleUnaryCall<ReqT, ResT> {
  return (call, callback) => {
    let identity: Identity;
    try {
      identity = extractIdentity(call);
    } catch (err: any) {
      callback({ code: grpc.status.UNAUTHENTICATED, message: `authentication failed: ${err.message}` }, null);
      return;
    }

    if (!policy(identity, fullMethod)) {
      callback({ code: grpc.status.PERMISSION_DENIED, message: `service ${identity.serviceName} is not authorized to call ${fullMethod}` }, null);
      return;
    }

    // Extract and validate RequestContext
    const reqCtx = deserializeRequestContext(call.metadata);
    if (reqCtx && reqCtx.callerService && reqCtx.callerService !== identity.serviceName) {
      callback({ code: grpc.status.PERMISSION_DENIED, message: `context spoofing detected: caller_service ${reqCtx.callerService} does not match SPIFFE identity ${identity.serviceName}` }, null);
      return;
    }

    // Attach context to call object for business handlers
    (call as any).requestContext = reqCtx;

    handler(call, callback);
  };
}



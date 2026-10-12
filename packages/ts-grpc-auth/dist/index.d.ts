import * as grpc from '@grpc/grpc-js';
import { RequestContext } from '@payment-gateway/protobuf/dist/generated/context';
export { RequestContext } from '@payment-gateway/protobuf/dist/generated/context';
export interface Identity {
    environment: string;
    serviceName: string;
}
export type PolicyFunc = (identity: Identity, fullMethod: string) => boolean;
export declare const REQUEST_CONTEXT_METADATA_KEY = "x-request-context";
/**
 * Serializes a RequestContext into a base64-encoded JSON string to inject into gRPC metadata.
 */
export declare function serializeRequestContext(ctx: RequestContext): string;
/**
 * Deserializes a RequestContext from a base64-encoded JSON string in gRPC metadata.
 * Returns null if not present.
 */
export declare function deserializeRequestContext(metadata: grpc.Metadata): RequestContext | null;
/**
 * Business Authorization helper.
 * Enforces tenant isolation: USER context MUST match the targetMerchantId.
 */
export declare function requireMerchant(reqCtx: RequestContext | null, targetMerchantId: string): void;
/**
 * Extracts SPIFFE identity from a gRPC call.
 */
export declare function extractIdentity(call: grpc.ServerUnaryCall<any, any>): Identity;
export declare function createServerCredentials(caCertPath: string, serverCertPath: string, serverKeyPath: string): grpc.ServerCredentials;
export declare function createClientCredentials(caCertPath: string, clientCertPath: string, clientKeyPath: string): grpc.ChannelCredentials;
export declare function applyAuthInterceptor<ReqT, ResT>(handler: grpc.handleUnaryCall<ReqT, ResT>, policy: PolicyFunc, fullMethod: string): grpc.handleUnaryCall<ReqT, ResT>;

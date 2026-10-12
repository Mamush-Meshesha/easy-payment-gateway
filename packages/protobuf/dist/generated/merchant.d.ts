import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "merchant";
export interface ProvisionMerchantRequest {
    merchantId: string;
    email: string;
    businessName: string;
}
export interface ProvisionMerchantResponse {
    success: boolean;
    error: string;
}
export interface ListMerchantsRequest {
    limit: number;
    offset: number;
}
export interface ListMerchantsResponse {
    merchants: ListMerchantsResponse_MerchantInfo[];
    total: number;
}
export interface ListMerchantsResponse_MerchantInfo {
    id: string;
    legalName: string;
    status: string;
    createdAt: string;
}
export interface SuspendMerchantRequest {
    merchantId: string;
    reason: string;
}
export interface SuspendMerchantResponse {
    success: boolean;
    status: string;
}
export interface UpdateMerchantLimitRequest {
    merchantId: string;
    currency: string;
    minAmount: number;
    maxAmount: number;
}
export interface UpdateMerchantLimitResponse {
    success: boolean;
}
export interface GetStatusRequest {
    merchantId: string;
}
export interface GetStatusResponse {
    status: string;
    exists: boolean;
}
export interface GetMerchantRequest {
    merchantId: string;
}
export interface GetMerchantResponse {
    id: string;
    legalName: string;
    status: string;
}
export interface ValidateApiKeyRequest {
    apiKey: string;
}
export interface ValidateApiKeyResponse {
    isValid: boolean;
    merchantId: string;
    /** e.g., 'test' or 'live' */
    environment: string;
}
export interface GetMerchantConfigRequest {
    merchantId: string;
}
export interface GetMerchantConfigResponse {
    merchantId: string;
    version: number;
    feeRouting: string;
    enabledPaymentMethods: string[];
}
export interface GetWebhookConfigRequest {
    merchantId: string;
    /** e.g., 'TEST' or 'LIVE' */
    environment: string;
}
export interface GetWebhookConfigResponse {
    webhookUrl: string;
    /** Protected in transit by mTLS */
    hmacSecret: string;
    secondaryHmacSecret: string;
    secondaryHmacExpiresAt: string;
}
export interface GetPayoutDestinationRequest {
    merchantId: string;
    currency: string;
}
export interface GetPayoutDestinationResponse {
    /** Tokenized reference instead of raw bank details */
    destinationToken: string;
    destinationBank: string;
    providerId: string;
}
export interface ApproveMerchantRequest {
    merchantId: string;
}
export interface ApproveMerchantResponse {
    success: boolean;
    status: string;
}
export declare const ProvisionMerchantRequest: MessageFns<ProvisionMerchantRequest>;
export declare const ProvisionMerchantResponse: MessageFns<ProvisionMerchantResponse>;
export declare const ListMerchantsRequest: MessageFns<ListMerchantsRequest>;
export declare const ListMerchantsResponse: MessageFns<ListMerchantsResponse>;
export declare const ListMerchantsResponse_MerchantInfo: MessageFns<ListMerchantsResponse_MerchantInfo>;
export declare const SuspendMerchantRequest: MessageFns<SuspendMerchantRequest>;
export declare const SuspendMerchantResponse: MessageFns<SuspendMerchantResponse>;
export declare const UpdateMerchantLimitRequest: MessageFns<UpdateMerchantLimitRequest>;
export declare const UpdateMerchantLimitResponse: MessageFns<UpdateMerchantLimitResponse>;
export declare const GetStatusRequest: MessageFns<GetStatusRequest>;
export declare const GetStatusResponse: MessageFns<GetStatusResponse>;
export declare const GetMerchantRequest: MessageFns<GetMerchantRequest>;
export declare const GetMerchantResponse: MessageFns<GetMerchantResponse>;
export declare const ValidateApiKeyRequest: MessageFns<ValidateApiKeyRequest>;
export declare const ValidateApiKeyResponse: MessageFns<ValidateApiKeyResponse>;
export declare const GetMerchantConfigRequest: MessageFns<GetMerchantConfigRequest>;
export declare const GetMerchantConfigResponse: MessageFns<GetMerchantConfigResponse>;
export declare const GetWebhookConfigRequest: MessageFns<GetWebhookConfigRequest>;
export declare const GetWebhookConfigResponse: MessageFns<GetWebhookConfigResponse>;
export declare const GetPayoutDestinationRequest: MessageFns<GetPayoutDestinationRequest>;
export declare const GetPayoutDestinationResponse: MessageFns<GetPayoutDestinationResponse>;
export declare const ApproveMerchantRequest: MessageFns<ApproveMerchantRequest>;
export declare const ApproveMerchantResponse: MessageFns<ApproveMerchantResponse>;
export type MerchantServiceService = typeof MerchantServiceService;
export declare const MerchantServiceService: {
    readonly getMerchant: {
        readonly path: "/merchant.MerchantService/GetMerchant";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetMerchantRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetMerchantRequest;
        readonly responseSerialize: (value: GetMerchantResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetMerchantResponse;
    };
    readonly getMerchantStatus: {
        readonly path: "/merchant.MerchantService/GetMerchantStatus";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetStatusRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetStatusRequest;
        readonly responseSerialize: (value: GetStatusResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetStatusResponse;
    };
    readonly validateApiKey: {
        readonly path: "/merchant.MerchantService/ValidateApiKey";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ValidateApiKeyRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ValidateApiKeyRequest;
        readonly responseSerialize: (value: ValidateApiKeyResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ValidateApiKeyResponse;
    };
    readonly getMerchantConfig: {
        readonly path: "/merchant.MerchantService/GetMerchantConfig";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetMerchantConfigRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetMerchantConfigRequest;
        readonly responseSerialize: (value: GetMerchantConfigResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetMerchantConfigResponse;
    };
    readonly getWebhookConfig: {
        readonly path: "/merchant.MerchantService/GetWebhookConfig";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetWebhookConfigRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetWebhookConfigRequest;
        readonly responseSerialize: (value: GetWebhookConfigResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetWebhookConfigResponse;
    };
    readonly getPayoutDestination: {
        readonly path: "/merchant.MerchantService/GetPayoutDestination";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetPayoutDestinationRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetPayoutDestinationRequest;
        readonly responseSerialize: (value: GetPayoutDestinationResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetPayoutDestinationResponse;
    };
    /** Admin endpoints */
    readonly listMerchants: {
        readonly path: "/merchant.MerchantService/ListMerchants";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ListMerchantsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ListMerchantsRequest;
        readonly responseSerialize: (value: ListMerchantsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ListMerchantsResponse;
    };
    readonly suspendMerchant: {
        readonly path: "/merchant.MerchantService/SuspendMerchant";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: SuspendMerchantRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => SuspendMerchantRequest;
        readonly responseSerialize: (value: SuspendMerchantResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => SuspendMerchantResponse;
    };
    readonly approveMerchant: {
        readonly path: "/merchant.MerchantService/ApproveMerchant";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ApproveMerchantRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ApproveMerchantRequest;
        readonly responseSerialize: (value: ApproveMerchantResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ApproveMerchantResponse;
    };
    readonly updateMerchantLimit: {
        readonly path: "/merchant.MerchantService/UpdateMerchantLimit";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: UpdateMerchantLimitRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => UpdateMerchantLimitRequest;
        readonly responseSerialize: (value: UpdateMerchantLimitResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => UpdateMerchantLimitResponse;
    };
    /** Provisioning */
    readonly provisionMerchant: {
        readonly path: "/merchant.MerchantService/ProvisionMerchant";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ProvisionMerchantRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ProvisionMerchantRequest;
        readonly responseSerialize: (value: ProvisionMerchantResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ProvisionMerchantResponse;
    };
};
export interface MerchantServiceServer extends UntypedServiceImplementation {
    getMerchant: handleUnaryCall<GetMerchantRequest, GetMerchantResponse>;
    getMerchantStatus: handleUnaryCall<GetStatusRequest, GetStatusResponse>;
    validateApiKey: handleUnaryCall<ValidateApiKeyRequest, ValidateApiKeyResponse>;
    getMerchantConfig: handleUnaryCall<GetMerchantConfigRequest, GetMerchantConfigResponse>;
    getWebhookConfig: handleUnaryCall<GetWebhookConfigRequest, GetWebhookConfigResponse>;
    getPayoutDestination: handleUnaryCall<GetPayoutDestinationRequest, GetPayoutDestinationResponse>;
    /** Admin endpoints */
    listMerchants: handleUnaryCall<ListMerchantsRequest, ListMerchantsResponse>;
    suspendMerchant: handleUnaryCall<SuspendMerchantRequest, SuspendMerchantResponse>;
    approveMerchant: handleUnaryCall<ApproveMerchantRequest, ApproveMerchantResponse>;
    updateMerchantLimit: handleUnaryCall<UpdateMerchantLimitRequest, UpdateMerchantLimitResponse>;
    /** Provisioning */
    provisionMerchant: handleUnaryCall<ProvisionMerchantRequest, ProvisionMerchantResponse>;
}
export interface MerchantServiceClient extends Client {
    getMerchant(request: GetMerchantRequest, callback: (error: ServiceError | null, response: GetMerchantResponse) => void): ClientUnaryCall;
    getMerchant(request: GetMerchantRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetMerchantResponse) => void): ClientUnaryCall;
    getMerchant(request: GetMerchantRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetMerchantResponse) => void): ClientUnaryCall;
    getMerchantStatus(request: GetStatusRequest, callback: (error: ServiceError | null, response: GetStatusResponse) => void): ClientUnaryCall;
    getMerchantStatus(request: GetStatusRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetStatusResponse) => void): ClientUnaryCall;
    getMerchantStatus(request: GetStatusRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetStatusResponse) => void): ClientUnaryCall;
    validateApiKey(request: ValidateApiKeyRequest, callback: (error: ServiceError | null, response: ValidateApiKeyResponse) => void): ClientUnaryCall;
    validateApiKey(request: ValidateApiKeyRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ValidateApiKeyResponse) => void): ClientUnaryCall;
    validateApiKey(request: ValidateApiKeyRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ValidateApiKeyResponse) => void): ClientUnaryCall;
    getMerchantConfig(request: GetMerchantConfigRequest, callback: (error: ServiceError | null, response: GetMerchantConfigResponse) => void): ClientUnaryCall;
    getMerchantConfig(request: GetMerchantConfigRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetMerchantConfigResponse) => void): ClientUnaryCall;
    getMerchantConfig(request: GetMerchantConfigRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetMerchantConfigResponse) => void): ClientUnaryCall;
    getWebhookConfig(request: GetWebhookConfigRequest, callback: (error: ServiceError | null, response: GetWebhookConfigResponse) => void): ClientUnaryCall;
    getWebhookConfig(request: GetWebhookConfigRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetWebhookConfigResponse) => void): ClientUnaryCall;
    getWebhookConfig(request: GetWebhookConfigRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetWebhookConfigResponse) => void): ClientUnaryCall;
    getPayoutDestination(request: GetPayoutDestinationRequest, callback: (error: ServiceError | null, response: GetPayoutDestinationResponse) => void): ClientUnaryCall;
    getPayoutDestination(request: GetPayoutDestinationRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetPayoutDestinationResponse) => void): ClientUnaryCall;
    getPayoutDestination(request: GetPayoutDestinationRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetPayoutDestinationResponse) => void): ClientUnaryCall;
    /** Admin endpoints */
    listMerchants(request: ListMerchantsRequest, callback: (error: ServiceError | null, response: ListMerchantsResponse) => void): ClientUnaryCall;
    listMerchants(request: ListMerchantsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ListMerchantsResponse) => void): ClientUnaryCall;
    listMerchants(request: ListMerchantsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ListMerchantsResponse) => void): ClientUnaryCall;
    suspendMerchant(request: SuspendMerchantRequest, callback: (error: ServiceError | null, response: SuspendMerchantResponse) => void): ClientUnaryCall;
    suspendMerchant(request: SuspendMerchantRequest, metadata: Metadata, callback: (error: ServiceError | null, response: SuspendMerchantResponse) => void): ClientUnaryCall;
    suspendMerchant(request: SuspendMerchantRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: SuspendMerchantResponse) => void): ClientUnaryCall;
    approveMerchant(request: ApproveMerchantRequest, callback: (error: ServiceError | null, response: ApproveMerchantResponse) => void): ClientUnaryCall;
    approveMerchant(request: ApproveMerchantRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ApproveMerchantResponse) => void): ClientUnaryCall;
    approveMerchant(request: ApproveMerchantRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ApproveMerchantResponse) => void): ClientUnaryCall;
    updateMerchantLimit(request: UpdateMerchantLimitRequest, callback: (error: ServiceError | null, response: UpdateMerchantLimitResponse) => void): ClientUnaryCall;
    updateMerchantLimit(request: UpdateMerchantLimitRequest, metadata: Metadata, callback: (error: ServiceError | null, response: UpdateMerchantLimitResponse) => void): ClientUnaryCall;
    updateMerchantLimit(request: UpdateMerchantLimitRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: UpdateMerchantLimitResponse) => void): ClientUnaryCall;
    /** Provisioning */
    provisionMerchant(request: ProvisionMerchantRequest, callback: (error: ServiceError | null, response: ProvisionMerchantResponse) => void): ClientUnaryCall;
    provisionMerchant(request: ProvisionMerchantRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ProvisionMerchantResponse) => void): ClientUnaryCall;
    provisionMerchant(request: ProvisionMerchantRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ProvisionMerchantResponse) => void): ClientUnaryCall;
}
export declare const MerchantServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): MerchantServiceClient;
    service: typeof MerchantServiceService;
    serviceName: string;
};
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};

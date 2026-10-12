import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "provider";
export interface ProviderStatusRequest {
    providerId: string;
}
export interface ProviderStatusResponse {
    isActive: boolean;
    error: string;
}
export interface InitiatePaymentRequest {
    paymentId: string;
    providerId: string;
    amount: number;
    currency: string;
    environment: string;
}
export interface InitiatePaymentResponse {
    /** SUCCESS, PENDING, FAILED, TIMEOUT */
    status: string;
}
export interface InitiateRefundRequest {
    refundId: string;
    providerId: string;
    amount: number;
    currency: string;
    originalProviderId?: string | undefined;
    environment: string;
}
export interface InitiateRefundResponse {
    /** SUCCESS, PENDING, FAILED, TIMEOUT */
    status: string;
}
export declare const ProviderStatusRequest: MessageFns<ProviderStatusRequest>;
export declare const ProviderStatusResponse: MessageFns<ProviderStatusResponse>;
export declare const InitiatePaymentRequest: MessageFns<InitiatePaymentRequest>;
export declare const InitiatePaymentResponse: MessageFns<InitiatePaymentResponse>;
export declare const InitiateRefundRequest: MessageFns<InitiateRefundRequest>;
export declare const InitiateRefundResponse: MessageFns<InitiateRefundResponse>;
export type ProviderServiceService = typeof ProviderServiceService;
export declare const ProviderServiceService: {
    readonly getProviderStatus: {
        readonly path: "/provider.ProviderService/GetProviderStatus";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ProviderStatusRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ProviderStatusRequest;
        readonly responseSerialize: (value: ProviderStatusResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ProviderStatusResponse;
    };
    readonly initiatePayment: {
        readonly path: "/provider.ProviderService/InitiatePayment";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: InitiatePaymentRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => InitiatePaymentRequest;
        readonly responseSerialize: (value: InitiatePaymentResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => InitiatePaymentResponse;
    };
    readonly initiateRefund: {
        readonly path: "/provider.ProviderService/InitiateRefund";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: InitiateRefundRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => InitiateRefundRequest;
        readonly responseSerialize: (value: InitiateRefundResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => InitiateRefundResponse;
    };
};
export interface ProviderServiceServer extends UntypedServiceImplementation {
    getProviderStatus: handleUnaryCall<ProviderStatusRequest, ProviderStatusResponse>;
    initiatePayment: handleUnaryCall<InitiatePaymentRequest, InitiatePaymentResponse>;
    initiateRefund: handleUnaryCall<InitiateRefundRequest, InitiateRefundResponse>;
}
export interface ProviderServiceClient extends Client {
    getProviderStatus(request: ProviderStatusRequest, callback: (error: ServiceError | null, response: ProviderStatusResponse) => void): ClientUnaryCall;
    getProviderStatus(request: ProviderStatusRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ProviderStatusResponse) => void): ClientUnaryCall;
    getProviderStatus(request: ProviderStatusRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ProviderStatusResponse) => void): ClientUnaryCall;
    initiatePayment(request: InitiatePaymentRequest, callback: (error: ServiceError | null, response: InitiatePaymentResponse) => void): ClientUnaryCall;
    initiatePayment(request: InitiatePaymentRequest, metadata: Metadata, callback: (error: ServiceError | null, response: InitiatePaymentResponse) => void): ClientUnaryCall;
    initiatePayment(request: InitiatePaymentRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: InitiatePaymentResponse) => void): ClientUnaryCall;
    initiateRefund(request: InitiateRefundRequest, callback: (error: ServiceError | null, response: InitiateRefundResponse) => void): ClientUnaryCall;
    initiateRefund(request: InitiateRefundRequest, metadata: Metadata, callback: (error: ServiceError | null, response: InitiateRefundResponse) => void): ClientUnaryCall;
    initiateRefund(request: InitiateRefundRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: InitiateRefundResponse) => void): ClientUnaryCall;
}
export declare const ProviderServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): ProviderServiceClient;
    service: typeof ProviderServiceService;
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

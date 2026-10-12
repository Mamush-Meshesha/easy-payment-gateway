import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "fx";
export interface GetExchangeRateRequest {
    /** e.g. USD */
    sourceCurrency: string;
    /** e.g. EUR */
    targetCurrency: string;
}
export interface GetExchangeRateResponse {
    /** e.g. 0.92 */
    rate: number;
    /** Unix timestamp of the rate */
    timestamp: number;
    /** Source of the rate (e.g. "bloomberg", "fixer") */
    provider: string;
}
export interface LockExchangeRateRequest {
    sourceCurrency: string;
    targetCurrency: string;
    /** Optional: lock for a specific amount */
    amount: number;
}
export interface LockExchangeRateResponse {
    /** Unique ID to reference this locked rate during settlement */
    lockId: string;
    /** The guaranteed rate */
    rate: number;
    /** Unix timestamp when the lock expires */
    expiresAt: number;
}
export declare const GetExchangeRateRequest: MessageFns<GetExchangeRateRequest>;
export declare const GetExchangeRateResponse: MessageFns<GetExchangeRateResponse>;
export declare const LockExchangeRateRequest: MessageFns<LockExchangeRateRequest>;
export declare const LockExchangeRateResponse: MessageFns<LockExchangeRateResponse>;
/**
 * The FxService provides real-time Foreign Exchange rates and handles
 * Dynamic Currency Conversion (DCC) calculations for cross-border payments.
 */
export type FxServiceService = typeof FxServiceService;
export declare const FxServiceService: {
    /** GetExchangeRate fetches the current exchange rate between two currencies. */
    readonly getExchangeRate: {
        readonly path: "/fx.FxService/GetExchangeRate";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetExchangeRateRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetExchangeRateRequest;
        readonly responseSerialize: (value: GetExchangeRateResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetExchangeRateResponse;
    };
    /** LockExchangeRate guarantees a rate for a specific transaction for a limited time (e.g. 15 mins). */
    readonly lockExchangeRate: {
        readonly path: "/fx.FxService/LockExchangeRate";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: LockExchangeRateRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => LockExchangeRateRequest;
        readonly responseSerialize: (value: LockExchangeRateResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => LockExchangeRateResponse;
    };
};
export interface FxServiceServer extends UntypedServiceImplementation {
    /** GetExchangeRate fetches the current exchange rate between two currencies. */
    getExchangeRate: handleUnaryCall<GetExchangeRateRequest, GetExchangeRateResponse>;
    /** LockExchangeRate guarantees a rate for a specific transaction for a limited time (e.g. 15 mins). */
    lockExchangeRate: handleUnaryCall<LockExchangeRateRequest, LockExchangeRateResponse>;
}
export interface FxServiceClient extends Client {
    /** GetExchangeRate fetches the current exchange rate between two currencies. */
    getExchangeRate(request: GetExchangeRateRequest, callback: (error: ServiceError | null, response: GetExchangeRateResponse) => void): ClientUnaryCall;
    getExchangeRate(request: GetExchangeRateRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetExchangeRateResponse) => void): ClientUnaryCall;
    getExchangeRate(request: GetExchangeRateRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetExchangeRateResponse) => void): ClientUnaryCall;
    /** LockExchangeRate guarantees a rate for a specific transaction for a limited time (e.g. 15 mins). */
    lockExchangeRate(request: LockExchangeRateRequest, callback: (error: ServiceError | null, response: LockExchangeRateResponse) => void): ClientUnaryCall;
    lockExchangeRate(request: LockExchangeRateRequest, metadata: Metadata, callback: (error: ServiceError | null, response: LockExchangeRateResponse) => void): ClientUnaryCall;
    lockExchangeRate(request: LockExchangeRateRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: LockExchangeRateResponse) => void): ClientUnaryCall;
}
export declare const FxServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): FxServiceClient;
    service: typeof FxServiceService;
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

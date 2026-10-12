import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "merchant";
export interface GetStatusRequest {
    merchantId: string;
}
export interface GetStatusResponse {
    status: string;
    exists: boolean;
}
export declare const GetStatusRequest: MessageFns<GetStatusRequest>;
export declare const GetStatusResponse: MessageFns<GetStatusResponse>;
export type MerchantServiceService = typeof MerchantServiceService;
export declare const MerchantServiceService: {
    readonly getMerchantStatus: {
        readonly path: "/merchant.MerchantService/GetMerchantStatus";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetStatusRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetStatusRequest;
        readonly responseSerialize: (value: GetStatusResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetStatusResponse;
    };
};
export interface MerchantServiceServer extends UntypedServiceImplementation {
    getMerchantStatus: handleUnaryCall<GetStatusRequest, GetStatusResponse>;
}
export interface MerchantServiceClient extends Client {
    getMerchantStatus(request: GetStatusRequest, callback: (error: ServiceError | null, response: GetStatusResponse) => void): ClientUnaryCall;
    getMerchantStatus(request: GetStatusRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetStatusResponse) => void): ClientUnaryCall;
    getMerchantStatus(request: GetStatusRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetStatusResponse) => void): ClientUnaryCall;
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

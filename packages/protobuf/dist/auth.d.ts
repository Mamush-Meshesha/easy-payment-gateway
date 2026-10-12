import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "auth";
export interface ProvisionRequest {
    merchantId: string;
    email: string;
    legalName: string;
}
export interface ProvisionResponse {
    success: boolean;
    userId: string;
    error: string;
}
export declare const ProvisionRequest: MessageFns<ProvisionRequest>;
export declare const ProvisionResponse: MessageFns<ProvisionResponse>;
export type AuthServiceService = typeof AuthServiceService;
export declare const AuthServiceService: {
    readonly provisionMerchantOwner: {
        readonly path: "/auth.AuthService/ProvisionMerchantOwner";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ProvisionRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ProvisionRequest;
        readonly responseSerialize: (value: ProvisionResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ProvisionResponse;
    };
};
export interface AuthServiceServer extends UntypedServiceImplementation {
    provisionMerchantOwner: handleUnaryCall<ProvisionRequest, ProvisionResponse>;
}
export interface AuthServiceClient extends Client {
    provisionMerchantOwner(request: ProvisionRequest, callback: (error: ServiceError | null, response: ProvisionResponse) => void): ClientUnaryCall;
    provisionMerchantOwner(request: ProvisionRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ProvisionResponse) => void): ClientUnaryCall;
    provisionMerchantOwner(request: ProvisionRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ProvisionResponse) => void): ClientUnaryCall;
}
export declare const AuthServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): AuthServiceClient;
    service: typeof AuthServiceService;
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

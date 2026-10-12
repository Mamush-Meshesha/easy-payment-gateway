import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "vault";
export interface TokenizeCardRequest {
    /** Raw 16-19 digit card number */
    pan: string;
    /** MM */
    expMonth: string;
    /** YYYY or YY */
    expYear: string;
    /** Optional for vaulting, usually required for immediate charge */
    cvv: string;
}
export interface TokenizeCardResponse {
    /** Safe token string, e.g., tok_... */
    token: string;
    /** Last 4 digits for display purposes */
    last4: string;
    /** Card brand (visa, mastercard, etc) */
    brand: string;
}
export interface DetokenizeCardRequest {
    token: string;
}
export interface DetokenizeCardResponse {
    pan: string;
    expMonth: string;
    expYear: string;
    cvv: string;
}
export declare const TokenizeCardRequest: MessageFns<TokenizeCardRequest>;
export declare const TokenizeCardResponse: MessageFns<TokenizeCardResponse>;
export declare const DetokenizeCardRequest: MessageFns<DetokenizeCardRequest>;
export declare const DetokenizeCardResponse: MessageFns<DetokenizeCardResponse>;
/**
 * The VaultService is a highly isolated PCI-DSS Level 1 compliant enclave.
 * Its sole purpose is to securely tokenize raw Primary Account Numbers (PAN)
 * using envelope encryption (KMS) and detokenize them only for authorized internal callers.
 */
export type VaultServiceService = typeof VaultServiceService;
export declare const VaultServiceService: {
    /** TokenizeCard accepts raw card data and returns a safe token (e.g. tok_123) */
    readonly tokenizeCard: {
        readonly path: "/vault.VaultService/TokenizeCard";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: TokenizeCardRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => TokenizeCardRequest;
        readonly responseSerialize: (value: TokenizeCardResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => TokenizeCardResponse;
    };
    /**
     * DetokenizeCard accepts a token and returns the raw PAN.
     * Restricted strictly to ProviderService for dispatching to acquiring banks.
     */
    readonly detokenizeCard: {
        readonly path: "/vault.VaultService/DetokenizeCard";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: DetokenizeCardRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => DetokenizeCardRequest;
        readonly responseSerialize: (value: DetokenizeCardResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => DetokenizeCardResponse;
    };
};
export interface VaultServiceServer extends UntypedServiceImplementation {
    /** TokenizeCard accepts raw card data and returns a safe token (e.g. tok_123) */
    tokenizeCard: handleUnaryCall<TokenizeCardRequest, TokenizeCardResponse>;
    /**
     * DetokenizeCard accepts a token and returns the raw PAN.
     * Restricted strictly to ProviderService for dispatching to acquiring banks.
     */
    detokenizeCard: handleUnaryCall<DetokenizeCardRequest, DetokenizeCardResponse>;
}
export interface VaultServiceClient extends Client {
    /** TokenizeCard accepts raw card data and returns a safe token (e.g. tok_123) */
    tokenizeCard(request: TokenizeCardRequest, callback: (error: ServiceError | null, response: TokenizeCardResponse) => void): ClientUnaryCall;
    tokenizeCard(request: TokenizeCardRequest, metadata: Metadata, callback: (error: ServiceError | null, response: TokenizeCardResponse) => void): ClientUnaryCall;
    tokenizeCard(request: TokenizeCardRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: TokenizeCardResponse) => void): ClientUnaryCall;
    /**
     * DetokenizeCard accepts a token and returns the raw PAN.
     * Restricted strictly to ProviderService for dispatching to acquiring banks.
     */
    detokenizeCard(request: DetokenizeCardRequest, callback: (error: ServiceError | null, response: DetokenizeCardResponse) => void): ClientUnaryCall;
    detokenizeCard(request: DetokenizeCardRequest, metadata: Metadata, callback: (error: ServiceError | null, response: DetokenizeCardResponse) => void): ClientUnaryCall;
    detokenizeCard(request: DetokenizeCardRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: DetokenizeCardResponse) => void): ClientUnaryCall;
}
export declare const VaultServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): VaultServiceClient;
    service: typeof VaultServiceService;
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

import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "pricing.v1";
export interface CalculateFeeRequest {
    merchantId: string;
    paymentMethod: string;
    amount: number;
    currency: string;
}
export interface CalculateFeeResponse {
    totalFee: number;
    platformCut: number;
    merchantCut: number;
    appliedRules: string[];
}
export declare const CalculateFeeRequest: MessageFns<CalculateFeeRequest>;
export declare const CalculateFeeResponse: MessageFns<CalculateFeeResponse>;
export type PricingServiceService = typeof PricingServiceService;
export declare const PricingServiceService: {
    readonly calculateFee: {
        readonly path: "/pricing.v1.PricingService/CalculateFee";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CalculateFeeRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CalculateFeeRequest;
        readonly responseSerialize: (value: CalculateFeeResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CalculateFeeResponse;
    };
};
export interface PricingServiceServer extends UntypedServiceImplementation {
    calculateFee: handleUnaryCall<CalculateFeeRequest, CalculateFeeResponse>;
}
export interface PricingServiceClient extends Client {
    calculateFee(request: CalculateFeeRequest, callback: (error: ServiceError | null, response: CalculateFeeResponse) => void): ClientUnaryCall;
    calculateFee(request: CalculateFeeRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CalculateFeeResponse) => void): ClientUnaryCall;
    calculateFee(request: CalculateFeeRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CalculateFeeResponse) => void): ClientUnaryCall;
}
export declare const PricingServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): PricingServiceClient;
    service: typeof PricingServiceService;
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

import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "settlement_read";
export interface GetSettlementsRequest {
    merchantId: string;
    limit: number;
    offset: number;
}
export interface Settlement {
    id: string;
    merchantId: string;
    amount: number;
    currency: string;
    status: string;
    destinationAccount: string;
    createdAt: string;
    updatedAt: string;
}
export interface GetSettlementsResponse {
    settlements: Settlement[];
    total: number;
}
export declare const GetSettlementsRequest: MessageFns<GetSettlementsRequest>;
export declare const Settlement: MessageFns<Settlement>;
export declare const GetSettlementsResponse: MessageFns<GetSettlementsResponse>;
export type SettlementReadServiceService = typeof SettlementReadServiceService;
export declare const SettlementReadServiceService: {
    readonly getSettlements: {
        readonly path: "/settlement_read.SettlementReadService/GetSettlements";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetSettlementsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetSettlementsRequest;
        readonly responseSerialize: (value: GetSettlementsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetSettlementsResponse;
    };
};
export interface SettlementReadServiceServer extends UntypedServiceImplementation {
    getSettlements: handleUnaryCall<GetSettlementsRequest, GetSettlementsResponse>;
}
export interface SettlementReadServiceClient extends Client {
    getSettlements(request: GetSettlementsRequest, callback: (error: ServiceError | null, response: GetSettlementsResponse) => void): ClientUnaryCall;
    getSettlements(request: GetSettlementsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetSettlementsResponse) => void): ClientUnaryCall;
    getSettlements(request: GetSettlementsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetSettlementsResponse) => void): ClientUnaryCall;
}
export declare const SettlementReadServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): SettlementReadServiceClient;
    service: typeof SettlementReadServiceService;
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

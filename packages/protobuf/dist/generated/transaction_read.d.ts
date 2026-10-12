import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "transaction_read";
export interface TransactionFilter {
    status: string;
    providerId: string;
    fromCreatedAt: string;
    toCreatedAt: string;
}
export interface GetTransactionsRequest {
    /** Must match RequestContext.merchant_id */
    merchantId: string;
    filter: TransactionFilter | undefined;
    afterCursor: string;
    limit: number;
}
export interface TransactionSummary {
    transactionId: string;
    paymentId: string;
    providerId: string;
    providerTransactionId: string;
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}
export interface GetTransactionsResponse {
    transactions: TransactionSummary[];
    nextCursor: string;
    hasMore: boolean;
}
export interface GetTransactionRequest {
    transactionId: string;
    /** Must match RequestContext.merchant_id */
    merchantId: string;
}
export interface GetTransactionResponse {
    transaction: TransactionSummary | undefined;
}
export declare const TransactionFilter: MessageFns<TransactionFilter>;
export declare const GetTransactionsRequest: MessageFns<GetTransactionsRequest>;
export declare const TransactionSummary: MessageFns<TransactionSummary>;
export declare const GetTransactionsResponse: MessageFns<GetTransactionsResponse>;
export declare const GetTransactionRequest: MessageFns<GetTransactionRequest>;
export declare const GetTransactionResponse: MessageFns<GetTransactionResponse>;
/**
 * BFF Read APIs for the Transaction Service.
 * All RPCs require RequestContext to be present in gRPC metadata.
 * Handlers MUST call RequireMerchant(ctx, req.merchant_id) before querying the DB.
 */
export type TransactionReadServiceService = typeof TransactionReadServiceService;
export declare const TransactionReadServiceService: {
    readonly getTransactions: {
        readonly path: "/transaction_read.TransactionReadService/GetTransactions";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetTransactionsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetTransactionsRequest;
        readonly responseSerialize: (value: GetTransactionsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetTransactionsResponse;
    };
    readonly getTransaction: {
        readonly path: "/transaction_read.TransactionReadService/GetTransaction";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetTransactionRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetTransactionRequest;
        readonly responseSerialize: (value: GetTransactionResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetTransactionResponse;
    };
};
export interface TransactionReadServiceServer extends UntypedServiceImplementation {
    getTransactions: handleUnaryCall<GetTransactionsRequest, GetTransactionsResponse>;
    getTransaction: handleUnaryCall<GetTransactionRequest, GetTransactionResponse>;
}
export interface TransactionReadServiceClient extends Client {
    getTransactions(request: GetTransactionsRequest, callback: (error: ServiceError | null, response: GetTransactionsResponse) => void): ClientUnaryCall;
    getTransactions(request: GetTransactionsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetTransactionsResponse) => void): ClientUnaryCall;
    getTransactions(request: GetTransactionsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetTransactionsResponse) => void): ClientUnaryCall;
    getTransaction(request: GetTransactionRequest, callback: (error: ServiceError | null, response: GetTransactionResponse) => void): ClientUnaryCall;
    getTransaction(request: GetTransactionRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetTransactionResponse) => void): ClientUnaryCall;
    getTransaction(request: GetTransactionRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetTransactionResponse) => void): ClientUnaryCall;
}
export declare const TransactionReadServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): TransactionReadServiceClient;
    service: typeof TransactionReadServiceService;
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

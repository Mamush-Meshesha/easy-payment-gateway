import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "payment_read";
export interface PaymentFilter {
    /** Optional: filter by status string */
    status: string;
    /** Optional: filter by currency */
    currency: string;
    /** ISO8601 lower bound */
    fromCreatedAt: string;
    /** ISO8601 upper bound */
    toCreatedAt: string;
}
export interface GetPaymentsRequest {
    /** Must match RequestContext.merchant_id */
    merchantId: string;
    filter: PaymentFilter | undefined;
    /** Cursor-based pagination */
    afterCursor: string;
    /** Max results; server-side ceiling enforced */
    limit: number;
}
export interface PaymentSummary {
    paymentId: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    customerId: string;
    merchantReference: string;
    refundedAmount: number;
}
export interface GetPaymentsResponse {
    payments: PaymentSummary[];
    nextCursor: string;
    hasMore: boolean;
}
export interface GetPaymentRequest {
    paymentId: string;
    /** Must match RequestContext.merchant_id */
    merchantId: string;
}
export interface GetPaymentResponse {
    payment: PaymentSummary | undefined;
}
export interface StatusHistoryEntry {
    status: string;
    reason: string;
    recordedAt: string;
}
export interface GetPaymentStatusHistoryRequest {
    paymentId: string;
    /** Must match RequestContext.merchant_id */
    merchantId: string;
}
export interface GetPaymentStatusHistoryResponse {
    entries: StatusHistoryEntry[];
}
export interface GetRefundsRequest {
    merchantId: string;
    /** Optional filter */
    paymentId: string;
    limit: number;
    offset: number;
}
export interface RefundSummary {
    id: string;
    paymentId: string;
    merchantId: string;
    amount: number;
    currency: string;
    status: string;
    reason: string;
    createdAt: string;
    updatedAt: string;
}
export interface GetRefundsResponse {
    refunds: RefundSummary[];
    total: number;
}
export declare const PaymentFilter: MessageFns<PaymentFilter>;
export declare const GetPaymentsRequest: MessageFns<GetPaymentsRequest>;
export declare const PaymentSummary: MessageFns<PaymentSummary>;
export declare const GetPaymentsResponse: MessageFns<GetPaymentsResponse>;
export declare const GetPaymentRequest: MessageFns<GetPaymentRequest>;
export declare const GetPaymentResponse: MessageFns<GetPaymentResponse>;
export declare const StatusHistoryEntry: MessageFns<StatusHistoryEntry>;
export declare const GetPaymentStatusHistoryRequest: MessageFns<GetPaymentStatusHistoryRequest>;
export declare const GetPaymentStatusHistoryResponse: MessageFns<GetPaymentStatusHistoryResponse>;
export declare const GetRefundsRequest: MessageFns<GetRefundsRequest>;
export declare const RefundSummary: MessageFns<RefundSummary>;
export declare const GetRefundsResponse: MessageFns<GetRefundsResponse>;
/**
 * BFF Read APIs for the Payment Service.
 * All RPCs require RequestContext to be present in gRPC metadata.
 * Handlers MUST call RequireMerchant(ctx, req.merchant_id) before querying the DB.
 */
export type PaymentReadServiceService = typeof PaymentReadServiceService;
export declare const PaymentReadServiceService: {
    readonly getPayments: {
        readonly path: "/payment_read.PaymentReadService/GetPayments";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetPaymentsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetPaymentsRequest;
        readonly responseSerialize: (value: GetPaymentsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetPaymentsResponse;
    };
    readonly getPayment: {
        readonly path: "/payment_read.PaymentReadService/GetPayment";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetPaymentRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetPaymentRequest;
        readonly responseSerialize: (value: GetPaymentResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetPaymentResponse;
    };
    readonly getPaymentStatusHistory: {
        readonly path: "/payment_read.PaymentReadService/GetPaymentStatusHistory";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetPaymentStatusHistoryRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetPaymentStatusHistoryRequest;
        readonly responseSerialize: (value: GetPaymentStatusHistoryResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetPaymentStatusHistoryResponse;
    };
    readonly getRefunds: {
        readonly path: "/payment_read.PaymentReadService/GetRefunds";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetRefundsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetRefundsRequest;
        readonly responseSerialize: (value: GetRefundsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetRefundsResponse;
    };
};
export interface PaymentReadServiceServer extends UntypedServiceImplementation {
    getPayments: handleUnaryCall<GetPaymentsRequest, GetPaymentsResponse>;
    getPayment: handleUnaryCall<GetPaymentRequest, GetPaymentResponse>;
    getPaymentStatusHistory: handleUnaryCall<GetPaymentStatusHistoryRequest, GetPaymentStatusHistoryResponse>;
    getRefunds: handleUnaryCall<GetRefundsRequest, GetRefundsResponse>;
}
export interface PaymentReadServiceClient extends Client {
    getPayments(request: GetPaymentsRequest, callback: (error: ServiceError | null, response: GetPaymentsResponse) => void): ClientUnaryCall;
    getPayments(request: GetPaymentsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetPaymentsResponse) => void): ClientUnaryCall;
    getPayments(request: GetPaymentsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetPaymentsResponse) => void): ClientUnaryCall;
    getPayment(request: GetPaymentRequest, callback: (error: ServiceError | null, response: GetPaymentResponse) => void): ClientUnaryCall;
    getPayment(request: GetPaymentRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetPaymentResponse) => void): ClientUnaryCall;
    getPayment(request: GetPaymentRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetPaymentResponse) => void): ClientUnaryCall;
    getPaymentStatusHistory(request: GetPaymentStatusHistoryRequest, callback: (error: ServiceError | null, response: GetPaymentStatusHistoryResponse) => void): ClientUnaryCall;
    getPaymentStatusHistory(request: GetPaymentStatusHistoryRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetPaymentStatusHistoryResponse) => void): ClientUnaryCall;
    getPaymentStatusHistory(request: GetPaymentStatusHistoryRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetPaymentStatusHistoryResponse) => void): ClientUnaryCall;
    getRefunds(request: GetRefundsRequest, callback: (error: ServiceError | null, response: GetRefundsResponse) => void): ClientUnaryCall;
    getRefunds(request: GetRefundsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetRefundsResponse) => void): ClientUnaryCall;
    getRefunds(request: GetRefundsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetRefundsResponse) => void): ClientUnaryCall;
}
export declare const PaymentReadServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): PaymentReadServiceClient;
    service: typeof PaymentReadServiceService;
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

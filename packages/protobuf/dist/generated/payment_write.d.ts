import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "payment_write";
export interface ExecutePaymentRequest {
    merchantId: string;
    /** Can be empty if using default or redirect */
    paymentMethodId: string;
    amount: number;
    currency: string;
    idempotencyKey: string;
}
export interface ExecutePaymentResponse {
    paymentId: string;
    status: string;
}
export declare const ExecutePaymentRequest: MessageFns<ExecutePaymentRequest>;
export declare const ExecutePaymentResponse: MessageFns<ExecutePaymentResponse>;
export type PaymentWriteServiceService = typeof PaymentWriteServiceService;
export declare const PaymentWriteServiceService: {
    readonly executePayment: {
        readonly path: "/payment_write.PaymentWriteService/ExecutePayment";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ExecutePaymentRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ExecutePaymentRequest;
        readonly responseSerialize: (value: ExecutePaymentResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ExecutePaymentResponse;
    };
};
export interface PaymentWriteServiceServer extends UntypedServiceImplementation {
    executePayment: handleUnaryCall<ExecutePaymentRequest, ExecutePaymentResponse>;
}
export interface PaymentWriteServiceClient extends Client {
    executePayment(request: ExecutePaymentRequest, callback: (error: ServiceError | null, response: ExecutePaymentResponse) => void): ClientUnaryCall;
    executePayment(request: ExecutePaymentRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ExecutePaymentResponse) => void): ClientUnaryCall;
    executePayment(request: ExecutePaymentRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ExecutePaymentResponse) => void): ClientUnaryCall;
}
export declare const PaymentWriteServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): PaymentWriteServiceClient;
    service: typeof PaymentWriteServiceService;
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

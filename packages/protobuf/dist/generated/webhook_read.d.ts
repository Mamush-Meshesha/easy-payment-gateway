import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "webhook_read";
export interface ReplayWebhookDeliveryRequest {
    merchantId: string;
    deliveryId: string;
}
export interface ReplayWebhookDeliveryResponse {
    success: boolean;
    message: string;
}
export interface GetWebhookDeliveriesRequest {
    merchantId: string;
    limit: number;
    offset: number;
}
export interface WebhookDelivery {
    id: string;
    merchantId: string;
    eventId: string;
    eventType: string;
    status: string;
    attemptCount: number;
    responseStatusCode: number;
    responseBody: string;
    createdAt: string;
    nextRetryAt: string;
    lastError: string;
    payload: string;
}
export interface GetWebhookDeliveriesResponse {
    deliveries: WebhookDelivery[];
    total: number;
}
export declare const ReplayWebhookDeliveryRequest: MessageFns<ReplayWebhookDeliveryRequest>;
export declare const ReplayWebhookDeliveryResponse: MessageFns<ReplayWebhookDeliveryResponse>;
export declare const GetWebhookDeliveriesRequest: MessageFns<GetWebhookDeliveriesRequest>;
export declare const WebhookDelivery: MessageFns<WebhookDelivery>;
export declare const GetWebhookDeliveriesResponse: MessageFns<GetWebhookDeliveriesResponse>;
export type WebhookReadServiceService = typeof WebhookReadServiceService;
export declare const WebhookReadServiceService: {
    readonly getWebhookDeliveries: {
        readonly path: "/webhook_read.WebhookReadService/GetWebhookDeliveries";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetWebhookDeliveriesRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetWebhookDeliveriesRequest;
        readonly responseSerialize: (value: GetWebhookDeliveriesResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetWebhookDeliveriesResponse;
    };
    readonly replayWebhookDelivery: {
        readonly path: "/webhook_read.WebhookReadService/ReplayWebhookDelivery";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ReplayWebhookDeliveryRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ReplayWebhookDeliveryRequest;
        readonly responseSerialize: (value: ReplayWebhookDeliveryResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ReplayWebhookDeliveryResponse;
    };
};
export interface WebhookReadServiceServer extends UntypedServiceImplementation {
    getWebhookDeliveries: handleUnaryCall<GetWebhookDeliveriesRequest, GetWebhookDeliveriesResponse>;
    replayWebhookDelivery: handleUnaryCall<ReplayWebhookDeliveryRequest, ReplayWebhookDeliveryResponse>;
}
export interface WebhookReadServiceClient extends Client {
    getWebhookDeliveries(request: GetWebhookDeliveriesRequest, callback: (error: ServiceError | null, response: GetWebhookDeliveriesResponse) => void): ClientUnaryCall;
    getWebhookDeliveries(request: GetWebhookDeliveriesRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetWebhookDeliveriesResponse) => void): ClientUnaryCall;
    getWebhookDeliveries(request: GetWebhookDeliveriesRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetWebhookDeliveriesResponse) => void): ClientUnaryCall;
    replayWebhookDelivery(request: ReplayWebhookDeliveryRequest, callback: (error: ServiceError | null, response: ReplayWebhookDeliveryResponse) => void): ClientUnaryCall;
    replayWebhookDelivery(request: ReplayWebhookDeliveryRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ReplayWebhookDeliveryResponse) => void): ClientUnaryCall;
    replayWebhookDelivery(request: ReplayWebhookDeliveryRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ReplayWebhookDeliveryResponse) => void): ClientUnaryCall;
}
export declare const WebhookReadServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): WebhookReadServiceClient;
    service: typeof WebhookReadServiceService;
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

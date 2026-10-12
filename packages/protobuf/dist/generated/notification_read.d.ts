import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "notification_read";
export interface GetNotificationsRequest {
    merchantId: string;
    limit: number;
    offset: number;
}
export interface NotificationLog {
    id: string;
    merchantId: string;
    /** "EMAIL" or "SMS" */
    type: string;
    recipient: string;
    subject: string;
    /** "SENT", "FAILED", "PENDING" */
    status: string;
    errorDetails: string;
    createdAt: string;
}
export interface GetNotificationsResponse {
    notifications: NotificationLog[];
    total: number;
}
export declare const GetNotificationsRequest: MessageFns<GetNotificationsRequest>;
export declare const NotificationLog: MessageFns<NotificationLog>;
export declare const GetNotificationsResponse: MessageFns<GetNotificationsResponse>;
export type NotificationReadServiceService = typeof NotificationReadServiceService;
export declare const NotificationReadServiceService: {
    readonly getNotifications: {
        readonly path: "/notification_read.NotificationReadService/GetNotifications";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetNotificationsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetNotificationsRequest;
        readonly responseSerialize: (value: GetNotificationsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetNotificationsResponse;
    };
};
export interface NotificationReadServiceServer extends UntypedServiceImplementation {
    getNotifications: handleUnaryCall<GetNotificationsRequest, GetNotificationsResponse>;
}
export interface NotificationReadServiceClient extends Client {
    getNotifications(request: GetNotificationsRequest, callback: (error: ServiceError | null, response: GetNotificationsResponse) => void): ClientUnaryCall;
    getNotifications(request: GetNotificationsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetNotificationsResponse) => void): ClientUnaryCall;
    getNotifications(request: GetNotificationsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetNotificationsResponse) => void): ClientUnaryCall;
}
export declare const NotificationReadServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): NotificationReadServiceClient;
    service: typeof NotificationReadServiceService;
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

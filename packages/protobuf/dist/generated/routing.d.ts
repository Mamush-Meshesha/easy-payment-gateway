import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "routing";
export interface DetermineRouteRequest {
    /** The first 6-8 digits of the card (Bank Identification Number) */
    bin: string;
    /** Payment currency (e.g., USD, EUR, ETB) */
    currency: string;
    /** Payment amount in minor units */
    amount: number;
    /** To check merchant specific routing rules/preferences */
    merchantId: string;
}
export interface DetermineRouteResponse {
    /** The selected provider ID (e.g. telebirr, stripe, adyen) */
    providerId: string;
    /** Explanation for auditing (e.g. "lowest_cost", "fallback_routing") */
    routeReason: string;
    /** Estimated interchange/processing fee in minor units */
    estimatedFee: number;
}
export declare const DetermineRouteRequest: MessageFns<DetermineRouteRequest>;
export declare const DetermineRouteResponse: MessageFns<DetermineRouteResponse>;
/**
 * The RoutingService is responsible for dynamically selecting the best acquiring
 * bank or provider based on BIN metadata, cost, and historical success rates.
 */
export type RoutingServiceService = typeof RoutingServiceService;
export declare const RoutingServiceService: {
    /** DetermineRoute analyzes a card BIN and payment metadata to return the optimal provider route. */
    readonly determineRoute: {
        readonly path: "/routing.RoutingService/DetermineRoute";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: DetermineRouteRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => DetermineRouteRequest;
        readonly responseSerialize: (value: DetermineRouteResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => DetermineRouteResponse;
    };
};
export interface RoutingServiceServer extends UntypedServiceImplementation {
    /** DetermineRoute analyzes a card BIN and payment metadata to return the optimal provider route. */
    determineRoute: handleUnaryCall<DetermineRouteRequest, DetermineRouteResponse>;
}
export interface RoutingServiceClient extends Client {
    /** DetermineRoute analyzes a card BIN and payment metadata to return the optimal provider route. */
    determineRoute(request: DetermineRouteRequest, callback: (error: ServiceError | null, response: DetermineRouteResponse) => void): ClientUnaryCall;
    determineRoute(request: DetermineRouteRequest, metadata: Metadata, callback: (error: ServiceError | null, response: DetermineRouteResponse) => void): ClientUnaryCall;
    determineRoute(request: DetermineRouteRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: DetermineRouteResponse) => void): ClientUnaryCall;
}
export declare const RoutingServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): RoutingServiceClient;
    service: typeof RoutingServiceService;
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

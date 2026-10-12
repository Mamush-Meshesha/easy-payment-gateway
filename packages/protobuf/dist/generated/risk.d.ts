import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "risk";
export interface CheckRiskRequest {
    paymentId: string;
    merchantId: string;
    amount: number;
    currency: string;
    customerId: string;
    ipAddress: string;
    paymentMethod: string;
}
export interface CheckRiskResponse {
    decisionId: string;
    /** ALLOW, FLAG, REVIEW, BLOCK, CHALLENGE */
    action: string;
    reason: string;
    triggeredRuleIds: string[];
    /** SUCCESS, UNAVAILABLE, TIMEOUT, ERROR */
    evaluationStatus: string;
    /** ML Probability score (0.0 to 1.0) */
    riskScore: number;
    /** Strong Customer Authentication flag */
    requires3ds: boolean;
}
export declare const CheckRiskRequest: MessageFns<CheckRiskRequest>;
export declare const CheckRiskResponse: MessageFns<CheckRiskResponse>;
export type RiskServiceService = typeof RiskServiceService;
export declare const RiskServiceService: {
    readonly checkRisk: {
        readonly path: "/risk.RiskService/CheckRisk";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CheckRiskRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CheckRiskRequest;
        readonly responseSerialize: (value: CheckRiskResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CheckRiskResponse;
    };
};
export interface RiskServiceServer extends UntypedServiceImplementation {
    checkRisk: handleUnaryCall<CheckRiskRequest, CheckRiskResponse>;
}
export interface RiskServiceClient extends Client {
    checkRisk(request: CheckRiskRequest, callback: (error: ServiceError | null, response: CheckRiskResponse) => void): ClientUnaryCall;
    checkRisk(request: CheckRiskRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CheckRiskResponse) => void): ClientUnaryCall;
    checkRisk(request: CheckRiskRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CheckRiskResponse) => void): ClientUnaryCall;
}
export declare const RiskServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): RiskServiceClient;
    service: typeof RiskServiceService;
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

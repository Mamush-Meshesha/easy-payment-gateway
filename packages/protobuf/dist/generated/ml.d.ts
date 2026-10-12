import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "ml";
export interface EvaluateFraudRequest {
    ipAddress: string;
    deviceFingerprint: string;
    amount: number;
    currency: string;
    customerId: string;
    bin: string;
    merchantId: string;
}
export interface EvaluateFraudResponse {
    /** 0.0 (safe) to 1.0 (fraud) */
    probabilityScore: number;
    /** e.g. ["high_velocity", "ip_distance_anomaly"] */
    riskFactors: string[];
}
export declare const EvaluateFraudRequest: MessageFns<EvaluateFraudRequest>;
export declare const EvaluateFraudResponse: MessageFns<EvaluateFraudResponse>;
/** The RiskMLService provides predictive ML scoring (TensorFlow/XGBoost) */
export type RiskMLServiceService = typeof RiskMLServiceService;
export declare const RiskMLServiceService: {
    readonly evaluateFraudProbability: {
        readonly path: "/ml.RiskMLService/EvaluateFraudProbability";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: EvaluateFraudRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => EvaluateFraudRequest;
        readonly responseSerialize: (value: EvaluateFraudResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => EvaluateFraudResponse;
    };
};
export interface RiskMLServiceServer extends UntypedServiceImplementation {
    evaluateFraudProbability: handleUnaryCall<EvaluateFraudRequest, EvaluateFraudResponse>;
}
export interface RiskMLServiceClient extends Client {
    evaluateFraudProbability(request: EvaluateFraudRequest, callback: (error: ServiceError | null, response: EvaluateFraudResponse) => void): ClientUnaryCall;
    evaluateFraudProbability(request: EvaluateFraudRequest, metadata: Metadata, callback: (error: ServiceError | null, response: EvaluateFraudResponse) => void): ClientUnaryCall;
    evaluateFraudProbability(request: EvaluateFraudRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: EvaluateFraudResponse) => void): ClientUnaryCall;
}
export declare const RiskMLServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): RiskMLServiceClient;
    service: typeof RiskMLServiceService;
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

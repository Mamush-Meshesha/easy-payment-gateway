import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "ledger";
export interface RecordJournalEntryRequest {
    referenceType: string;
    referenceId: string;
    currency: string;
    lines: JournalLineRequest[];
    providerId: string;
    providerTransactionId: string;
    environment: string;
}
export interface JournalLineRequest {
    accountId: string;
    /** "DEBIT" or "CREDIT" */
    direction: string;
    amount: number;
}
export interface RecordJournalEntryResponse {
    success: boolean;
    error: string;
    journalEntryId: string;
}
export interface GetLedgerEntriesRequest {
    providerId: string;
    providerTransactionIds: string[];
}
export interface GetLedgerEntriesResponse {
    entries: LedgerEntry[];
}
export interface ReserveFundsRequest {
    merchantId: string;
    currency: string;
    amount: number;
    /** Settlement ID */
    referenceId: string;
    environment: string;
}
export interface ReserveFundsResponse {
    status: string;
}
export interface ReleaseReservedFundsRequest {
    merchantId: string;
    currency: string;
    amount: number;
    /** Settlement ID */
    originalReferenceId: string;
    environment: string;
}
export interface ReleaseReservedFundsResponse {
    status: string;
}
export interface CompleteSettlementRequest {
    merchantId: string;
    currency: string;
    amount: number;
    /** Settlement ID */
    originalReferenceId: string;
    environment: string;
}
export interface CompleteSettlementResponse {
    status: string;
}
export interface LedgerEntry {
    journalEntryId: string;
    referenceType: string;
    referenceId: string;
    providerId: string;
    providerTransactionId: string;
    amount: number;
    currency: string;
    effectiveAt: string;
}
export interface GetLedgerBalancesRequest {
    /** Must match RequestContext.merchant_id */
    merchantId: string;
    /** Optional: filter by currency */
    currency: string;
}
export interface AccountBalance {
    accountId: string;
    accountType: string;
    accountGroup: string;
    currency: string;
    balanceMinorUnits: number;
}
export interface GetLedgerBalancesResponse {
    balances: AccountBalance[];
}
export interface GetLedgerEntriesPaginatedRequest {
    /** Must match RequestContext.merchant_id */
    merchantId: string;
    /** Optional filter */
    currency: string;
    /** Cursor-based pagination; empty = first page */
    afterCursor: string;
    /** Max results per page; server enforces ceiling */
    limit: number;
}
export interface GetLedgerEntriesPaginatedResponse {
    entries: LedgerEntry[];
    /** Empty if no more pages */
    nextCursor: string;
    hasMore: boolean;
}
export declare const RecordJournalEntryRequest: MessageFns<RecordJournalEntryRequest>;
export declare const JournalLineRequest: MessageFns<JournalLineRequest>;
export declare const RecordJournalEntryResponse: MessageFns<RecordJournalEntryResponse>;
export declare const GetLedgerEntriesRequest: MessageFns<GetLedgerEntriesRequest>;
export declare const GetLedgerEntriesResponse: MessageFns<GetLedgerEntriesResponse>;
export declare const ReserveFundsRequest: MessageFns<ReserveFundsRequest>;
export declare const ReserveFundsResponse: MessageFns<ReserveFundsResponse>;
export declare const ReleaseReservedFundsRequest: MessageFns<ReleaseReservedFundsRequest>;
export declare const ReleaseReservedFundsResponse: MessageFns<ReleaseReservedFundsResponse>;
export declare const CompleteSettlementRequest: MessageFns<CompleteSettlementRequest>;
export declare const CompleteSettlementResponse: MessageFns<CompleteSettlementResponse>;
export declare const LedgerEntry: MessageFns<LedgerEntry>;
export declare const GetLedgerBalancesRequest: MessageFns<GetLedgerBalancesRequest>;
export declare const AccountBalance: MessageFns<AccountBalance>;
export declare const GetLedgerBalancesResponse: MessageFns<GetLedgerBalancesResponse>;
export declare const GetLedgerEntriesPaginatedRequest: MessageFns<GetLedgerEntriesPaginatedRequest>;
export declare const GetLedgerEntriesPaginatedResponse: MessageFns<GetLedgerEntriesPaginatedResponse>;
export type LedgerServiceService = typeof LedgerServiceService;
export declare const LedgerServiceService: {
    readonly recordJournalEntry: {
        readonly path: "/ledger.LedgerService/RecordJournalEntry";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: RecordJournalEntryRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => RecordJournalEntryRequest;
        readonly responseSerialize: (value: RecordJournalEntryResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => RecordJournalEntryResponse;
    };
    readonly getLedgerEntriesByReferences: {
        readonly path: "/ledger.LedgerService/GetLedgerEntriesByReferences";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetLedgerEntriesRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetLedgerEntriesRequest;
        readonly responseSerialize: (value: GetLedgerEntriesResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetLedgerEntriesResponse;
    };
    /** Settlement Financial Operations */
    readonly reserveFunds: {
        readonly path: "/ledger.LedgerService/ReserveFunds";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ReserveFundsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ReserveFundsRequest;
        readonly responseSerialize: (value: ReserveFundsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ReserveFundsResponse;
    };
    readonly releaseReservedFunds: {
        readonly path: "/ledger.LedgerService/ReleaseReservedFunds";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ReleaseReservedFundsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ReleaseReservedFundsRequest;
        readonly responseSerialize: (value: ReleaseReservedFundsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ReleaseReservedFundsResponse;
    };
    readonly completeSettlement: {
        readonly path: "/ledger.LedgerService/CompleteSettlement";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CompleteSettlementRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CompleteSettlementRequest;
        readonly responseSerialize: (value: CompleteSettlementResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CompleteSettlementResponse;
    };
    /** BFF Read APIs — caller MUST provide valid RequestContext with merchant_id */
    readonly getLedgerBalances: {
        readonly path: "/ledger.LedgerService/GetLedgerBalances";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetLedgerBalancesRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetLedgerBalancesRequest;
        readonly responseSerialize: (value: GetLedgerBalancesResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetLedgerBalancesResponse;
    };
    readonly getLedgerEntriesPaginated: {
        readonly path: "/ledger.LedgerService/GetLedgerEntriesPaginated";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetLedgerEntriesPaginatedRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetLedgerEntriesPaginatedRequest;
        readonly responseSerialize: (value: GetLedgerEntriesPaginatedResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetLedgerEntriesPaginatedResponse;
    };
};
export interface LedgerServiceServer extends UntypedServiceImplementation {
    recordJournalEntry: handleUnaryCall<RecordJournalEntryRequest, RecordJournalEntryResponse>;
    getLedgerEntriesByReferences: handleUnaryCall<GetLedgerEntriesRequest, GetLedgerEntriesResponse>;
    /** Settlement Financial Operations */
    reserveFunds: handleUnaryCall<ReserveFundsRequest, ReserveFundsResponse>;
    releaseReservedFunds: handleUnaryCall<ReleaseReservedFundsRequest, ReleaseReservedFundsResponse>;
    completeSettlement: handleUnaryCall<CompleteSettlementRequest, CompleteSettlementResponse>;
    /** BFF Read APIs — caller MUST provide valid RequestContext with merchant_id */
    getLedgerBalances: handleUnaryCall<GetLedgerBalancesRequest, GetLedgerBalancesResponse>;
    getLedgerEntriesPaginated: handleUnaryCall<GetLedgerEntriesPaginatedRequest, GetLedgerEntriesPaginatedResponse>;
}
export interface LedgerServiceClient extends Client {
    recordJournalEntry(request: RecordJournalEntryRequest, callback: (error: ServiceError | null, response: RecordJournalEntryResponse) => void): ClientUnaryCall;
    recordJournalEntry(request: RecordJournalEntryRequest, metadata: Metadata, callback: (error: ServiceError | null, response: RecordJournalEntryResponse) => void): ClientUnaryCall;
    recordJournalEntry(request: RecordJournalEntryRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: RecordJournalEntryResponse) => void): ClientUnaryCall;
    getLedgerEntriesByReferences(request: GetLedgerEntriesRequest, callback: (error: ServiceError | null, response: GetLedgerEntriesResponse) => void): ClientUnaryCall;
    getLedgerEntriesByReferences(request: GetLedgerEntriesRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetLedgerEntriesResponse) => void): ClientUnaryCall;
    getLedgerEntriesByReferences(request: GetLedgerEntriesRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetLedgerEntriesResponse) => void): ClientUnaryCall;
    /** Settlement Financial Operations */
    reserveFunds(request: ReserveFundsRequest, callback: (error: ServiceError | null, response: ReserveFundsResponse) => void): ClientUnaryCall;
    reserveFunds(request: ReserveFundsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ReserveFundsResponse) => void): ClientUnaryCall;
    reserveFunds(request: ReserveFundsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ReserveFundsResponse) => void): ClientUnaryCall;
    releaseReservedFunds(request: ReleaseReservedFundsRequest, callback: (error: ServiceError | null, response: ReleaseReservedFundsResponse) => void): ClientUnaryCall;
    releaseReservedFunds(request: ReleaseReservedFundsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ReleaseReservedFundsResponse) => void): ClientUnaryCall;
    releaseReservedFunds(request: ReleaseReservedFundsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ReleaseReservedFundsResponse) => void): ClientUnaryCall;
    completeSettlement(request: CompleteSettlementRequest, callback: (error: ServiceError | null, response: CompleteSettlementResponse) => void): ClientUnaryCall;
    completeSettlement(request: CompleteSettlementRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CompleteSettlementResponse) => void): ClientUnaryCall;
    completeSettlement(request: CompleteSettlementRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CompleteSettlementResponse) => void): ClientUnaryCall;
    /** BFF Read APIs — caller MUST provide valid RequestContext with merchant_id */
    getLedgerBalances(request: GetLedgerBalancesRequest, callback: (error: ServiceError | null, response: GetLedgerBalancesResponse) => void): ClientUnaryCall;
    getLedgerBalances(request: GetLedgerBalancesRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetLedgerBalancesResponse) => void): ClientUnaryCall;
    getLedgerBalances(request: GetLedgerBalancesRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetLedgerBalancesResponse) => void): ClientUnaryCall;
    getLedgerEntriesPaginated(request: GetLedgerEntriesPaginatedRequest, callback: (error: ServiceError | null, response: GetLedgerEntriesPaginatedResponse) => void): ClientUnaryCall;
    getLedgerEntriesPaginated(request: GetLedgerEntriesPaginatedRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetLedgerEntriesPaginatedResponse) => void): ClientUnaryCall;
    getLedgerEntriesPaginated(request: GetLedgerEntriesPaginatedRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetLedgerEntriesPaginatedResponse) => void): ClientUnaryCall;
}
export declare const LedgerServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): LedgerServiceClient;
    service: typeof LedgerServiceService;
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

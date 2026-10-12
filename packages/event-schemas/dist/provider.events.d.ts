export declare enum ProviderEventTypes {
    PROVIDER_NORMALIZED_EVENT = "provider.normalized.event"
}
export interface ProviderNormalizedEvent {
    eventId: string;
    providerId: string;
    providerTransactionId: string;
    paymentId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    rawPayload: any;
    timestamp: string;
}

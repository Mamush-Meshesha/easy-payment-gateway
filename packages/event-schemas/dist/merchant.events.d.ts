export interface EventEnvelope<T> {
    eventId: string;
    eventType: string;
    eventVersion: number;
    occurredAt: string;
    producer: string;
    correlationId: string;
    causationId?: string;
    payload: T;
}
export interface MerchantStatusChangedEvent {
    merchantId: string;
    previousStatus: string;
    newStatus: string;
    changedAt: string;
    reason?: string;
}
export interface MerchantCreatedEvent {
    merchantId: string;
    email: string;
    legalName: string;
    createdAt: string;
}
export interface MerchantConfigUpdatedEvent {
    merchant_id: string;
    version: number;
    fee_routing: string;
    enabled_payment_methods: string[];
    updated_at: string;
}

export enum ProviderEventTypes {
  PROVIDER_NORMALIZED_EVENT = 'provider.normalized.event',
}

export interface ProviderNormalizedEvent {
  eventId: string; // Idempotency key for this webhook
  providerId: string;
  providerTransactionId: string;
  paymentId: string; // Mapped from the merchant's original request
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  rawPayload: any; // For audit
  timestamp: string; // ISO8601
}

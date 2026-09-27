export interface EventEnvelope<T> {
  eventId: string;
  eventType: string; // e.g., 'merchant.status.changed'
  eventVersion: number;
  occurredAt: string; // ISO 8601
  producer: string; // e.g., 'merchant-service'
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

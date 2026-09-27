export enum PaymentEventTypes {
  PAYMENT_STATUS_CHANGED = 'payment.status.changed',
}

export interface PaymentStatusChangedEvent {
  paymentId: string;
  merchantId: string;
  merchantReference: string;
  previousStatus: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string; // ISO8601
}

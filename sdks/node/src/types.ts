export type PaymentStatus = 
  | 'CREATED'
  | 'INITIATED'
  | 'PROCESSING'
  | 'PENDING'
  | 'UNKNOWN'
  | 'COMPLETION_PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  reason: string;
  merchantId: string;
  environment: 'LIVE' | 'TEST';
  merchantReference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
}

export interface CreatePaymentOptions {
  merchantReference: string;
  amount: number; // in smallest denomination (e.g. cents)
  currency: string;
  customerId?: string;
  ipAddress?: string;
  paymentMethod: string; // e.g. 'TELEBIRR', 'CBE_BIRR', 'CARD'
  providerId: string;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  status: 'REQUESTED' | 'PENDING' | 'REFUNDED' | 'FAILED' | 'UNKNOWN';
  amount: number;
  reason?: string;
  createdAt: string;
}

export interface RefundPaymentOptions {
  amount: number;
  reason?: string;
}

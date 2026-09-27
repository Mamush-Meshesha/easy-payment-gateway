import { HTTPClient } from '../client';
import { CreatePaymentOptions, PaymentResponse, RefundPaymentOptions, RefundResponse } from '../types';
import * as crypto from 'crypto';

export class Payments {
  private client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  /**
   * Create a new payment.
   * @param data The payment details.
   * @param idempotencyKey An optional UUID v4 to ensure safe retries. If not provided, one will be generated automatically.
   */
  public async create(data: CreatePaymentOptions, idempotencyKey?: string): Promise<PaymentResponse> {
    const key = idempotencyKey || crypto.randomUUID();
    return this.client.request<PaymentResponse>('POST', '/payments', data, {
      'Idempotency-Key': key,
    });
  }

  /**
   * Get public details for a payment (used for hosted checkout validation).
   * @param paymentId The UUID of the payment.
   */
  public async getPublicDetails(paymentId: string): Promise<Record<string, any>> {
    return this.client.request<Record<string, any>>('GET', `/checkout/payments/${paymentId}`);
  }

  /**
   * Refund a previously successful payment.
   * @param paymentId The UUID of the payment to refund.
   * @param data Refund details (amount and optional reason).
   * @param idempotencyKey An optional UUID v4 to ensure safe retries. If not provided, one will be generated automatically.
   */
  public async refund(paymentId: string, data: RefundPaymentOptions, idempotencyKey?: string): Promise<RefundResponse> {
    const key = idempotencyKey || crypto.randomUUID();
    return this.client.request<RefundResponse>('POST', `/payments/${paymentId}/refund`, data, {
      'Idempotency-Key': key,
    });
  }
}

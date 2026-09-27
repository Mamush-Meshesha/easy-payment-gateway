import { HTTPClient, ClientOptions } from './client';
import { Payments } from './resources/payments';
import { Webhooks } from './resources/webhooks';

export * from './types';
export * from './errors';

export class PaymentGateway {
  private readonly client: HTTPClient;
  public readonly payments: Payments;
  public readonly webhooks: Webhooks;

  /**
   * Initialize the Payment Gateway SDK.
   * @param apiKey Your secret API key (`sk_live_...` or `sk_test_...`)
   * @param options Optional configuration overrides
   */
  constructor(apiKey: string, options?: Omit<ClientOptions, 'apiKey'>) {
    this.client = new HTTPClient({ apiKey, ...options });
    
    this.payments = new Payments(this.client);
    this.webhooks = new Webhooks();
  }
}

export default PaymentGateway;

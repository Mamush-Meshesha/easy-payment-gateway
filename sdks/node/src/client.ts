import { GatewayError, AuthenticationError, IdempotencyError, APIConnectionError, ValidationError } from './errors';

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
}

export class HTTPClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;

  constructor(options: ClientOptions) {
    if (!options.apiKey) {
      throw new Error('An apiKey is required to initialize the Payment Gateway SDK.');
    }
    
    this.apiKey = options.apiKey;
    
    // Auto-detect environment based on key prefix if baseUrl isn't provided
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
    } else {
      this.baseUrl = this.apiKey.startsWith('sk_test_')
        ? 'https://sandbox.api.yourgateway.com/api/v1'
        : 'https://api.yourgateway.com/api/v1';
    }
    
    this.maxRetries = options.maxRetries ?? 2;
  }

  public async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'User-Agent': 'payment-gateway-node/1.0.0',
      ...headers,
    };

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: data ? JSON.stringify(data) : undefined,
        });

        if (response.ok) {
          // 204 No Content won't have JSON
          if (response.status === 204) {
            return {} as T;
          }
          return await response.json() as T;
        }

        // Handle standardized API errors
        const errorBody = await response.json().catch(() => ({}));
        this.handleAPIError(response.status, errorBody);

      } catch (err: any) {
        if (err instanceof GatewayError) {
          throw err;
        }
        
        // Only retry network connectivity errors
        if (attempt < this.maxRetries) {
          attempt++;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        throw new APIConnectionError(`Failed to connect to Gateway API: ${err.message}`);
      }
    }
    
    throw new APIConnectionError('Max retries exceeded');
  }

  private handleAPIError(status: number, body: any): never {
    const code = body.error || 'unknown_error';
    const message = body.message || 'An unknown error occurred';
    const reference = body.reference;

    switch (status) {
      case 401:
        throw new AuthenticationError(message, reference);
      case 409:
        throw new IdempotencyError(message, reference);
      case 400:
        throw new ValidationError(message, code, reference);
      default:
        throw new GatewayError(message, code, reference);
    }
  }
}

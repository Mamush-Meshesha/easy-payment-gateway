import * as crypto from 'crypto';
import { GatewayError } from '../errors';

export class Webhooks {
  /**
   * Verifies the signature of an incoming webhook payload.
   * @param payload The raw, unparsed JSON string body of the request.
   * @param signatureHeader The `X-Webhook-Signature` header value from the request.
   * @param secret Your webhook signing secret (available in the merchant dashboard).
   * @returns boolean Returns true if the signature is valid. Throws an error otherwise.
   */
  public verifySignature(payload: string, signatureHeader: string, secret: string): boolean {
    if (!payload) {
      throw new GatewayError('Webhook payload is empty.', 'invalid_payload');
    }
    if (!signatureHeader) {
      throw new GatewayError('Webhook signature header (X-Webhook-Signature) is missing.', 'missing_signature');
    }
    if (!secret) {
      throw new GatewayError('Webhook secret is required to verify signatures.', 'missing_secret');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use a constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signatureHeader, 'utf8')
    );

    if (!isValid) {
      throw new GatewayError('Webhook signature verification failed.', 'invalid_signature');
    }

    return true;
  }
}

export class GatewayError extends Error {
  public readonly code: string;
  public readonly reference?: string;

  constructor(message: string, code: string, reference?: string) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.reference = reference;
  }
}

export class AuthenticationError extends GatewayError {
  constructor(message: string, reference?: string) {
    super(message, 'invalid_api_key', reference);
    this.name = 'AuthenticationError';
  }
}

export class IdempotencyError extends GatewayError {
  constructor(message: string, reference?: string) {
    super(message, 'idempotency_key_mismatch', reference);
    this.name = 'IdempotencyError';
  }
}

export class APIConnectionError extends GatewayError {
  constructor(message: string) {
    super(message, 'api_connection_error');
    this.name = 'APIConnectionError';
  }
}

export class ValidationError extends GatewayError {
  constructor(message: string, code: string = 'validation_failed', reference?: string) {
    super(message, code, reference);
    this.name = 'ValidationError';
  }
}

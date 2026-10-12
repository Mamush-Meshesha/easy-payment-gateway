import { Request, Response, NextFunction } from 'express';
/**
 * Machine-readable error codes for the Payment Gateway API.
 * SDKs MUST switch on these codes, not on the human-readable `message`.
 * These codes are versioned and will not change between minor API versions.
 */
export declare const ErrorCode: {
    readonly MISSING_IDEMPOTENCY_KEY: "missing_idempotency_key";
    readonly MISSING_API_KEY: "missing_api_key";
    readonly INVALID_PAYLOAD: "invalid_payload";
    readonly INVALID_JSON: "invalid_json";
    readonly VALIDATION_FAILED: "validation_failed";
    readonly INVALID_PAYMENT_ID: "invalid_payment_id";
    readonly INVALID_CURRENCY: "invalid_currency";
    readonly INVALID_AMOUNT: "invalid_amount";
    readonly PAYMENT_METHOD_DISABLED: "payment_method_disabled";
    readonly INVALID_API_KEY: "invalid_api_key";
    readonly UNAUTHORIZED: "unauthorized";
    readonly TOKEN_EXPIRED: "token_expired";
    readonly FORBIDDEN: "forbidden";
    readonly MERCHANT_SUSPENDED: "merchant_suspended";
    readonly INSUFFICIENT_PERMISSIONS: "insufficient_permissions";
    readonly PAYMENT_NOT_FOUND: "payment_not_found";
    readonly MERCHANT_NOT_FOUND: "merchant_not_found";
    readonly RESOURCE_NOT_FOUND: "resource_not_found";
    readonly IDEMPOTENCY_KEY_MISMATCH: "idempotency_key_mismatch";
    readonly DUPLICATE_REQUEST: "duplicate_request";
    readonly EMAIL_ALREADY_REGISTERED: "email_already_registered";
    readonly RISK_REJECTED: "risk_rejected";
    readonly REFUND_EXCEEDS_AMOUNT: "refund_exceeds_payment_amount";
    readonly PAYMENT_NOT_REFUNDABLE: "payment_not_refundable";
    readonly INSUFFICIENT_FUNDS: "insufficient_funds";
    readonly INVALID_STATE_TRANSITION: "invalid_state_transition";
    readonly PROVIDER_UNAVAILABLE: "provider_unavailable";
    readonly PROVIDER_TIMEOUT: "provider_timeout";
    readonly INTERNAL_ERROR: "internal_error";
};
export type ErrorCodeValue = typeof ErrorCode[keyof typeof ErrorCode];
/**
 * APIError is the canonical error response body for all public-facing HTTP errors.
 * Every service MUST use this structure for error responses.
 */
export interface APIError {
    /** Stable machine-readable error code. SDKs should switch on this. */
    error: ErrorCodeValue;
    /** Human-readable message. May change between releases. Do not parse. */
    message: string;
    /** Optional trace ID or correlation ID for support lookups. */
    reference?: string;
}
/**
 * AppError is the internal error class used to carry error codes through
 * Express middleware chains. Throw this from service/controller layers.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: ErrorCodeValue;
    readonly reference?: string | undefined;
    constructor(statusCode: number, code: ErrorCodeValue, message: string, reference?: string | undefined);
    static badRequest(code: ErrorCodeValue, message: string): AppError;
    static unauthorized(code: ErrorCodeValue, message: string): AppError;
    static forbidden(code: ErrorCodeValue, message: string): AppError;
    static notFound(code: ErrorCodeValue, message: string): AppError;
    static conflict(code: ErrorCodeValue, message: string): AppError;
    static unprocessable(code: ErrorCodeValue, message: string): AppError;
    static internal(reference?: string): AppError;
}
/**
 * standardErrorHandler is the Express 4-argument error middleware that converts
 * any error (AppError or unexpected) into the canonical APIError JSON response.
 *
 * Usage: app.use(standardErrorHandler)  ← must be LAST middleware
 */
export declare function standardErrorHandler(err: any, req: Request, res: Response, _next: NextFunction): void;
export { standardErrorHandler as errorHandler };

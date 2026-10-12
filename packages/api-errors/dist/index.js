"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorCode = void 0;
exports.standardErrorHandler = standardErrorHandler;
exports.errorHandler = standardErrorHandler;
/**
 * Machine-readable error codes for the Payment Gateway API.
 * SDKs MUST switch on these codes, not on the human-readable `message`.
 * These codes are versioned and will not change between minor API versions.
 */
exports.ErrorCode = {
    // 400 — Bad Request
    MISSING_IDEMPOTENCY_KEY: 'missing_idempotency_key',
    MISSING_API_KEY: 'missing_api_key',
    INVALID_PAYLOAD: 'invalid_payload',
    INVALID_JSON: 'invalid_json',
    VALIDATION_FAILED: 'validation_failed',
    INVALID_PAYMENT_ID: 'invalid_payment_id',
    INVALID_CURRENCY: 'invalid_currency',
    INVALID_AMOUNT: 'invalid_amount',
    PAYMENT_METHOD_DISABLED: 'payment_method_disabled',
    // 401 — Unauthorized
    INVALID_API_KEY: 'invalid_api_key',
    UNAUTHORIZED: 'unauthorized',
    TOKEN_EXPIRED: 'token_expired',
    // 403 — Forbidden
    FORBIDDEN: 'forbidden',
    MERCHANT_SUSPENDED: 'merchant_suspended',
    INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
    // 404 — Not Found
    PAYMENT_NOT_FOUND: 'payment_not_found',
    MERCHANT_NOT_FOUND: 'merchant_not_found',
    RESOURCE_NOT_FOUND: 'resource_not_found',
    // 409 — Conflict
    IDEMPOTENCY_KEY_MISMATCH: 'idempotency_key_mismatch',
    DUPLICATE_REQUEST: 'duplicate_request',
    EMAIL_ALREADY_REGISTERED: 'email_already_registered',
    // 422 — Unprocessable Entity
    RISK_REJECTED: 'risk_rejected',
    REFUND_EXCEEDS_AMOUNT: 'refund_exceeds_payment_amount',
    PAYMENT_NOT_REFUNDABLE: 'payment_not_refundable',
    INSUFFICIENT_FUNDS: 'insufficient_funds',
    INVALID_STATE_TRANSITION: 'invalid_state_transition',
    // 502 — Bad Gateway
    PROVIDER_UNAVAILABLE: 'provider_unavailable',
    // 504 — Gateway Timeout
    PROVIDER_TIMEOUT: 'provider_timeout',
    // 500 — Internal Server Error
    INTERNAL_ERROR: 'internal_error',
};
/**
 * AppError is the internal error class used to carry error codes through
 * Express middleware chains. Throw this from service/controller layers.
 */
class AppError extends Error {
    statusCode;
    code;
    reference;
    constructor(statusCode, code, message, reference) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.reference = reference;
        this.name = 'AppError';
    }
    // Factory helpers for common error types
    static badRequest(code, message) {
        return new AppError(400, code, message);
    }
    static unauthorized(code, message) {
        return new AppError(401, code, message);
    }
    static forbidden(code, message) {
        return new AppError(403, code, message);
    }
    static notFound(code, message) {
        return new AppError(404, code, message);
    }
    static conflict(code, message) {
        return new AppError(409, code, message);
    }
    static unprocessable(code, message) {
        return new AppError(422, code, message);
    }
    static internal(reference) {
        return new AppError(500, exports.ErrorCode.INTERNAL_ERROR, 'An internal error occurred. Please contact support with your reference ID.', reference);
    }
}
exports.AppError = AppError;
/**
 * standardErrorHandler is the Express 4-argument error middleware that converts
 * any error (AppError or unexpected) into the canonical APIError JSON response.
 *
 * Usage: app.use(standardErrorHandler)  ← must be LAST middleware
 */
function standardErrorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    const traceId = req.headers['x-trace-id'] ?? undefined;
    if (err instanceof AppError) {
        const body = {
            error: err.code,
            message: err.message,
            reference: err.reference ?? traceId,
        };
        res.status(err.statusCode).json(body);
        return;
    }
    // Unexpected error — never leak internal details to the client
    console.error(`[UNHANDLED ERROR] ${err?.message ?? err}`, {
        stack: err?.stack,
        path: req.path,
        method: req.method,
    });
    const body = {
        error: exports.ErrorCode.INTERNAL_ERROR,
        message: 'An internal error occurred. Please contact support with your reference ID.',
        reference: traceId,
    };
    res.status(500).json(body);
}

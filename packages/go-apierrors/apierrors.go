// Package apierrors defines the standard API error response format used across
// all Go microservices in the payment gateway. Every HTTP error response from
// any service MUST use this structure so that merchant SDKs and the developer
// portal can rely on a single, stable error contract.
package apierrors

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorCode is a machine-readable error code string.
type ErrorCode string

const (
	// 400 — Bad Request
	ErrCodeMissingIdempotencyKey ErrorCode = "missing_idempotency_key"
	ErrCodeMissingAPIKey         ErrorCode = "missing_api_key"
	ErrCodeInvalidPayload        ErrorCode = "invalid_payload"
	ErrCodeInvalidJSON           ErrorCode = "invalid_json"
	ErrCodeValidationFailed      ErrorCode = "validation_failed"
	ErrCodeInvalidPaymentID      ErrorCode = "invalid_payment_id"
	ErrCodeInvalidCurrency       ErrorCode = "invalid_currency"
	ErrCodeInvalidAmount         ErrorCode = "invalid_amount"
	ErrCodePaymentMethodDisabled ErrorCode = "payment_method_disabled"

	// 401 — Unauthorized
	ErrCodeInvalidAPIKey ErrorCode = "invalid_api_key"
	ErrCodeUnauthorized  ErrorCode = "unauthorized"

	// 403 — Forbidden
	ErrCodeForbidden          ErrorCode = "forbidden"
	ErrCodeMerchantSuspended  ErrorCode = "merchant_suspended"

	// 404 — Not Found
	ErrCodePaymentNotFound  ErrorCode = "payment_not_found"
	ErrCodeMerchantNotFound ErrorCode = "merchant_not_found"
	ErrCodeProviderNotFound ErrorCode = "provider_not_found"
	ErrCodeResourceNotFound ErrorCode = "resource_not_found"

	// 409 — Conflict
	ErrCodeIdempotencyMismatch ErrorCode = "idempotency_key_mismatch"
	ErrCodeDuplicateRequest    ErrorCode = "duplicate_request"

	// 422 — Unprocessable Entity
	ErrCodeRiskRejected          ErrorCode = "risk_rejected"
	ErrCodeRefundExceedsAmount   ErrorCode = "refund_exceeds_payment_amount"
	ErrCodePaymentNotRefundable  ErrorCode = "payment_not_refundable"
	ErrCodeInsufficientFunds     ErrorCode = "insufficient_funds"
	ErrCodeInvalidStateTransition ErrorCode = "invalid_state_transition"

	// 502 — Bad Gateway
	ErrCodeProviderUnavailable ErrorCode = "provider_unavailable"

	// 504 — Gateway Timeout
	ErrCodeProviderTimeout ErrorCode = "provider_timeout"

	// 500 — Internal Server Error
	ErrCodeInternalError ErrorCode = "internal_error"
)

// APIError is the canonical error response body for all public-facing HTTP errors.
type APIError struct {
	// Code is a stable, machine-readable error identifier. Never changes between
	// API versions — SDKs should switch on this field, not the message.
	Code ErrorCode `json:"error"`

	// Message is a human-readable description of the error. May change. Do not
	// programmatically parse this field.
	Message string `json:"message"`

	// Reference is an optional trace ID or correlation ID for support lookups.
	Reference string `json:"reference,omitempty"`
}

// Respond writes a standardized JSON error response.
func Respond(c *gin.Context, status int, code ErrorCode, message string) {
	traceID := c.GetHeader("X-Trace-Id")
	c.JSON(status, APIError{
		Code:      code,
		Message:   message,
		Reference: traceID,
	})
}

// Convenience wrappers

func BadRequest(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusBadRequest, code, message)
}

func Unauthorized(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusUnauthorized, code, message)
}

func Forbidden(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusForbidden, code, message)
}

func NotFound(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusNotFound, code, message)
}

func Conflict(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusConflict, code, message)
}

func UnprocessableEntity(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusUnprocessableEntity, code, message)
}

func BadGateway(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusBadGateway, code, message)
}

func GatewayTimeout(c *gin.Context, code ErrorCode, message string) {
	Respond(c, http.StatusGatewayTimeout, code, message)
}

func InternalError(c *gin.Context, reference string) {
	c.JSON(http.StatusInternalServerError, APIError{
		Code:      ErrCodeInternalError,
		Message:   "An internal error occurred. Please contact support with your reference ID.",
		Reference: reference,
	})
}

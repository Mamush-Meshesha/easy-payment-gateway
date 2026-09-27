// Package gologger provides a structured, context-aware logger for all Go microservices.
// It uses the standard library's slog package and automatically extracts OpenTelemetry
// trace/span IDs and request context fields (merchant_id, subject_id, correlation_id)
// from the Go context — without requiring callers to pass them explicitly.
//
// CRITICAL: This logger MUST NEVER log:
//   - JWTs or session tokens
//   - API keys or provider credentials
//   - Passwords, PINs, OTPs
//   - Webhook secrets or private keys
//   - Sensitive payment instrument details
//
// Financial correctness MUST NOT depend on this logger.
// If logging fails, the business operation continues normally.
package gologger

import (
	"context"
	"log/slog"
	"os"

	grpcauth "payment-gateway/go-grpc-auth"
	"go.opentelemetry.io/otel/trace"
)

// contextKey type for safe context value storage.
type contextKey struct{ name string }

var (
	correlationIDKey = contextKey{"correlation_id"}
	requestIDKey     = contextKey{"request_id"}
)

// Logger wraps slog.Logger to provide context-aware structured logging.
type Logger struct {
	inner *slog.Logger
}

// New creates a new Logger that writes JSON-structured logs to stdout.
func New(serviceName string) *Logger {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	return &Logger{
		inner: slog.New(handler).With("service", serviceName),
	}
}

// WithCorrelationID stores a correlation ID in the context for automatic log attachment.
func WithCorrelationID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, correlationIDKey, id)
}

// WithRequestID stores a request ID in the context.
func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey, id)
}

// fromContext extracts slog attributes from the context.
// Missing values are omitted — never filled with placeholder defaults.
func fromContext(ctx context.Context) []slog.Attr {
	attrs := []slog.Attr{}

	// OpenTelemetry trace/span IDs
	span := trace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		attrs = append(attrs,
			slog.String("trace_id", span.SpanContext().TraceID().String()),
			slog.String("span_id", span.SpanContext().SpanID().String()),
		)
	}

	// Request context (merchant_id, subject_id) from gRPC interceptor
	if reqCtx, ok := grpcauth.GetRequestContext(ctx); ok && reqCtx != nil {
		if reqCtx.MerchantId != "" {
			attrs = append(attrs, slog.String("merchant_id", reqCtx.MerchantId))
		}
		if reqCtx.SubjectId != "" {
			attrs = append(attrs, slog.String("subject_id", reqCtx.SubjectId))
		}
	}

	// Correlation / Request IDs
	if v, ok := ctx.Value(correlationIDKey).(string); ok && v != "" {
		attrs = append(attrs, slog.String("correlation_id", v))
	}
	if v, ok := ctx.Value(requestIDKey).(string); ok && v != "" {
		attrs = append(attrs, slog.String("request_id", v))
	}

	return attrs
}

func (l *Logger) Info(ctx context.Context, msg string, args ...any) {
	attrs := fromContext(ctx)
	l.inner.LogAttrs(ctx, slog.LevelInfo, msg, append(attrs, toAttrs(args...)...)...)
}

func (l *Logger) Warn(ctx context.Context, msg string, args ...any) {
	attrs := fromContext(ctx)
	l.inner.LogAttrs(ctx, slog.LevelWarn, msg, append(attrs, toAttrs(args...)...)...)
}

func (l *Logger) Error(ctx context.Context, msg string, args ...any) {
	attrs := fromContext(ctx)
	l.inner.LogAttrs(ctx, slog.LevelError, msg, append(attrs, toAttrs(args...)...)...)
}

func (l *Logger) Debug(ctx context.Context, msg string, args ...any) {
	attrs := fromContext(ctx)
	l.inner.LogAttrs(ctx, slog.LevelDebug, msg, append(attrs, toAttrs(args...)...)...)
}

// toAttrs converts variadic key/value pairs to slog.Attr slice.
func toAttrs(args ...any) []slog.Attr {
	attrs := make([]slog.Attr, 0, len(args)/2)
	for i := 0; i+1 < len(args); i += 2 {
		key, ok := args[i].(string)
		if !ok {
			continue
		}
		attrs = append(attrs, slog.Any(key, args[i+1]))
	}
	return attrs
}

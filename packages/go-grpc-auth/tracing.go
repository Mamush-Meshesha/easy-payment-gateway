package grpcauth

import (
	"context"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.30.0"
	"go.opentelemetry.io/otel/trace"
)

// InitTracer configures a stdout trace exporter for a given service name.
// In production, swap stdouttrace for an OTLP exporter (e.g., Jaeger).
// Returns a TracerProvider shutdown function. Call defer shutdown(context.Background()).
func InitTracer(serviceName string) (trace.TracerProvider, func(context.Context) error) {
	exporter, err := stdouttrace.New(stdouttrace.WithWriter(os.Stdout))
	if err != nil {
		panic("failed to create trace exporter: " + err.Error())
	}

	res, err := resource.New(context.Background(),
		resource.WithAttributes(semconv.ServiceName(serviceName)),
	)
	if err != nil {
		panic("failed to create resource: " + err.Error())
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)

	return tp, tp.Shutdown
}

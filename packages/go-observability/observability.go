package observability

import (
	"context"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

// InitTracing initializes the OpenTelemetry tracer provider and sets it globally.
func InitTracing(serviceName string) (*sdktrace.TracerProvider, error) {
	ctx := context.Background()

	endpoint := os.Getenv("OTLP_ENDPOINT")
	if endpoint == "" {
		endpoint = "localhost:4317"
	}

	exp, err := otlptracegrpc.New(ctx, otlptracegrpc.WithEndpoint(endpoint), otlptracegrpc.WithInsecure())
	if err != nil {
		return nil, err
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
		),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	return tp, nil
}

// ---------------------------------------------------------------------------
// Prometheus Metrics
// ---------------------------------------------------------------------------

var (
	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests.",
			Buckets: []float64{0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5},
		},
		[]string{"method", "route", "status"},
	)
)

func init() {
	prometheus.MustRegister(httpRequestDuration)
}

// MetricsMiddleware creates a Gin middleware that records the duration of HTTP requests.
func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start).Seconds()
		
		status := c.Writer.Status()
		route := c.FullPath()
		if route == "" {
			route = "unknown"
		}
		
		httpRequestDuration.WithLabelValues(c.Request.Method, route, string(rune(status))).Observe(duration)
	}
}

// MetricsHandler returns the prometheus HTTP handler for Gin.
func MetricsHandler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}

// ---------------------------------------------------------------------------
// Structured Logging
// ---------------------------------------------------------------------------

func NewStructuredLogger(serviceName string) *logrus.Logger {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel != "" {
		level, err := logrus.ParseLevel(logLevel)
		if err == nil {
			logger.SetLevel(level)
		}
	}
	
	// Add default fields (service name)
	// We can't do this easily at the logger level in Logrus without hooks, 
	// but developers can use logger.WithField("service", serviceName)
	
	return logger
}

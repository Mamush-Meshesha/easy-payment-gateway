FROM golang:alpine AS builder

WORKDIR /app

# We are running from the monorepo root.
# Copy go.mod and go.sum of the specific service first (if they exist)
# For now, we assume standard Go structure.
COPY services/payment-service/go.mod services/payment-service/
# COPY services/payment-service/go.sum services/payment-service/

WORKDIR /app/services/payment-service
RUN go mod download || true

WORKDIR /app
# Copy the rest of the monorepo (respecting .dockerignore)
COPY . .

# Build the Go binary
WORKDIR /app/services/payment-service
RUN go mod tidy && go build -o app ./cmd/server

# Final runtime image
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/services/payment-service/app .

CMD ["./app"]

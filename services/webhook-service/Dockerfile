FROM golang:alpine AS builder

WORKDIR /app

# We are running from the monorepo root.
# Copy go.mod and go.sum of the specific service first (if they exist)
# For now, we assume standard Go structure.
COPY services/webhook-service/go.mod services/webhook-service/
# COPY services/webhook-service/go.sum services/webhook-service/

WORKDIR /app/services/webhook-service
RUN go mod download || true

WORKDIR /app
# Copy the rest of the monorepo (respecting .dockerignore)
COPY . .

# Build the Go binary
WORKDIR /app/services/webhook-service
RUN go mod tidy && go build -o app ./cmd/server

# Final runtime image
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/services/webhook-service/app .

CMD ["./app"]

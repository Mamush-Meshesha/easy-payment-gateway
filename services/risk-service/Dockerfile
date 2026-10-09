FROM golang:alpine AS builder

WORKDIR /app

# We are running from the monorepo root.
# Copy go.mod and go.sum of the specific service first (if they exist)
# For now, we assume standard Go structure.
COPY services/risk-service/go.mod services/risk-service/
# COPY services/risk-service/go.sum services/risk-service/

WORKDIR /app/services/risk-service
RUN go mod download || true

WORKDIR /app
# Copy the rest of the monorepo (respecting .dockerignore)
COPY . .

# Build the Go binary
WORKDIR /app/services/risk-service
RUN go mod tidy && go build -o app ./cmd/server

# Final runtime image
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/services/risk-service/app .

CMD ["./app"]

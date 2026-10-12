FROM golang:alpine AS builder

WORKDIR /app

COPY services/billing-service/go.mod services/billing-service/

WORKDIR /app/services/billing-service
RUN go mod download || true

WORKDIR /app
COPY . .

WORKDIR /app/services/billing-service
RUN go mod tidy && go build -o app ./cmd/server

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/services/billing-service/app .

CMD ["./app"]

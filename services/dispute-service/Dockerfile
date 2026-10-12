FROM golang:alpine AS builder

WORKDIR /app

COPY services/dispute-service/go.mod services/dispute-service/

WORKDIR /app/services/dispute-service
RUN go mod download || true

WORKDIR /app
COPY . .

WORKDIR /app/services/dispute-service
RUN go mod tidy && go build -o app ./cmd/server

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/services/dispute-service/app .

CMD ["./app"]

.PHONY: infra infra-down infra-logs proto dev dev-ts dev-go test db db-studio

ifneq (,$(wildcard ./.env.local))
    include .env.local
    export
endif

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

infra:
	docker compose -f docker-compose.infra.yml up -d

infra-down:
	docker compose -f docker-compose.infra.yml down

infra-logs:
	docker compose -f docker-compose.infra.yml logs -f

db:
	@echo "Connecting to PostgreSQL database..."
	docker exec -it payment_postgres psql -U postgres -d payment_gateway

db-studio:
	@echo "Starting Prisma Studio for merchant-service..."
	cd services/merchant-service && npx prisma studio


proto:
	npm run proto:generate
	@echo "Re-generating Go protobufs..."
	protoc -I=packages/protobuf/src \
		--go_out=. --go_opt=module=payment-gateway \
		--go-grpc_out=. --go-grpc_opt=module=payment-gateway \
		packages/protobuf/src/*.proto
	@echo "Protobufs generated successfully!"

dev-ts:
	@echo "Starting TS services..."
	@cd services/auth-service && PORT=3001 GRPC_PORT=50051 MTLS_SERVER_CERT=../../infra/certs/auth-service.crt MTLS_SERVER_KEY=../../infra/certs/auth-service.key npm run dev & \
	cd services/merchant-service && PORT=3002 GRPC_PORT=50052 MTLS_SERVER_CERT=../../infra/certs/merchant-service.crt MTLS_SERVER_KEY=../../infra/certs/merchant-service.key npm run dev & \
	cd services/admin-service && PORT=3003 GRPC_PORT=50058 MTLS_SERVER_CERT=../../infra/certs/admin-service.crt MTLS_SERVER_KEY=../../infra/certs/admin-service.key npm run dev & \
	cd services/notification-service && PORT=3004 MTLS_SERVER_CERT=../../infra/certs/notification-service.crt MTLS_SERVER_KEY=../../infra/certs/notification-service.key npm run dev & \
	cd services/reporting-service && PORT=3008 MTLS_SERVER_CERT=../../infra/certs/reporting-service.crt MTLS_SERVER_KEY=../../infra/certs/reporting-service.key npm run dev & \
	cd services/dashboard-service && PORT=3009 MTLS_SERVER_CERT=../../infra/certs/dashboard-service.crt MTLS_SERVER_KEY=../../infra/certs/dashboard-service.key npm run dev & \
	wait

dev-go:
	@echo "Starting Go services (you may need a multiplexer like tmux or overmind for better log separation)"
	@cd services/ledger-service && PORT=8085 GRPC_PORT=50053 MTLS_SERVER_CERT=../../infra/certs/ledger-service.crt MTLS_SERVER_KEY=../../infra/certs/ledger-service.key go run cmd/server/main.go & \
	cd services/payment-service && PORT=8084 GRPC_PORT=50059 MTLS_SERVER_CERT=../../infra/certs/payment-service.crt MTLS_SERVER_KEY=../../infra/certs/payment-service.key go run cmd/server/main.go & \
	cd services/provider-service && PORT=8087 GRPC_PORT=50055 MTLS_SERVER_CERT=../../infra/certs/provider-service.crt MTLS_SERVER_KEY=../../infra/certs/provider-service.key go run cmd/server/main.go & \
	cd services/risk-service && PORT=8086 GRPC_PORT=50054 MTLS_SERVER_CERT=../../infra/certs/risk-service.crt MTLS_SERVER_KEY=../../infra/certs/risk-service.key go run cmd/server/main.go & \
	cd services/transaction-service && PORT=8088 GRPC_PORT=50061 MTLS_SERVER_CERT=../../infra/certs/transaction-service.crt MTLS_SERVER_KEY=../../infra/certs/transaction-service.key go run cmd/server/main.go & \
	cd services/reconciliation-service && PORT=3015 GRPC_PORT=50057 MTLS_SERVER_CERT=../../infra/certs/reconciliation-service.crt MTLS_SERVER_KEY=../../infra/certs/reconciliation-service.key go run cmd/server/main.go & \
	cd services/settlement-service && PORT=3010 GRPC_PORT=50060 MTLS_SERVER_CERT=../../infra/certs/settlement-service.crt MTLS_SERVER_KEY=../../infra/certs/settlement-service.key go run cmd/server/main.go & \
	cd services/webhook-service && PORT=3014 GRPC_PORT=50056 MTLS_SERVER_CERT=../../infra/certs/webhook-service.crt MTLS_SERVER_KEY=../../infra/certs/webhook-service.key go run cmd/server/main.go & \
	cd services/billing-service && PORT=3016 GRPC_PORT=50062 MTLS_SERVER_CERT=../../infra/certs/billing-service.crt MTLS_SERVER_KEY=../../infra/certs/billing-service.key go run cmd/server/main.go & \
	cd services/dispute-service && PORT=3017 GRPC_PORT=50063 MTLS_SERVER_CERT=../../infra/certs/dispute-service.crt MTLS_SERVER_KEY=../../infra/certs/dispute-service.key go run cmd/server/main.go & \
	cd services/pricing-service && PORT=3018 GRPC_PORT=50064 MTLS_SERVER_CERT=../../infra/certs/pricing-service.crt MTLS_SERVER_KEY=../../infra/certs/pricing-service.key go run cmd/server/main.go & \
	cd services/vault-service && PORT=3019 GRPC_PORT=50065 MTLS_SERVER_CERT=../../infra/certs/vault-service.crt MTLS_SERVER_KEY=../../infra/certs/vault-service.key go run cmd/server/main.go & \
	cd services/routing-service && PORT=3020 GRPC_PORT=50066 MTLS_SERVER_CERT=../../infra/certs/routing-service.crt MTLS_SERVER_KEY=../../infra/certs/routing-service.key go run cmd/server/main.go & \
	cd services/fx-service && PORT=3021 GRPC_PORT=50067 MTLS_SERVER_CERT=../../infra/certs/fx-service.crt MTLS_SERVER_KEY=../../infra/certs/fx-service.key go run cmd/server/main.go & \
	cd services/risk-ml-worker && PORT=50068 bash -c "source venv/bin/activate && python3 main.py" & \
	wait

dev:
	@echo "Running all TS and Go services..."
	@make dev-ts & make dev-go & wait

test:
	./scripts/run-e2e.sh
test-env:
	@echo "DATABASE_URL=$$DATABASE_URL"

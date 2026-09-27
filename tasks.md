# Phase 3 Tasks: Auth & Merchant Services

*This document outlines the detailed, step-by-step tasks required to implement the Auth and Merchant services in a production-ready manner.*

## 1. Project Scaffolding
- [ ] Initialize `package.json` for both `auth-service` and `merchant-service`.
- [ ] Install production dependencies (Express, Prisma, Zod, jsonwebtoken, bcrypt, helmet, cors).
- [ ] Install dev dependencies (TypeScript, Jest, Supertest, ESLint, Prettier, nodemon).
- [ ] Configure `tsconfig.json` for both services.
- [ ] Configure ESLint and Prettier for strict code quality.

## 2. Database & ORM Setup
- [ ] Create `schema.prisma` for `auth-service` (User, Role, UserRole, AuditLog).
- [ ] Create `schema.prisma` for `merchant-service` (Merchant, ApiKey, WebhookConfig).
- [ ] Run initial migrations to generate the databases inside the local Postgres container.
- [ ] Setup singleton Prisma clients in the `dal/` layer.

## 3. Core Architecture Implementation (Auth Service)
- [ ] Implement `utils/logger.ts` for structured JSON logging.
- [ ] Implement `middlewares/errorHandler.ts` (mapping Zod errors, internal errors, etc. securely).
- [ ] Implement `middlewares/rateLimiter.ts` using Redis (or memory temporarily if Redis setup requires extra library).
- [ ] Implement `dtos/auth.dto.ts` with class-validator schemas.
- [ ] Implement `services/auth.service.ts` containing bcrypt hashing, JWT issuance, and business logic.
- [ ] Implement `controller/auth.controller.ts`.
- [ ] Wire up `routes/auth.routes.ts` and mount in `app.ts`.

## 4. Core Architecture Implementation (Merchant Service)
- [ ] Implement standard middlewares (Logger, Error Handler).
- [ ] Implement `middlewares/auth.middleware.ts` to protect routes by validating the JWT from the Auth service.
- [ ] Implement `dtos/merchant.dto.ts` with class-validator schemas.
- [ ] Implement `services/merchant.service.ts` containing API key generation logic (hashing the key before DB storage, returning raw key only once).
- [ ] Implement `controller/merchant.controller.ts`.
- [ ] Wire up `routes/merchant.routes.ts` and mount in `app.ts`.

## 5. Automated Testing
- [ ] Setup Jest configuration.
- [ ] Write unit tests for `auth.service.ts` (password hashing, token generation).
- [ ] Write unit tests for `merchant.service.ts` (API key secure generation).
- [ ] Write integration tests for Auth endpoints (`POST /login` with valid/invalid credentials).
- [ ] Write integration tests for Merchant endpoints (`POST /api-keys` ensuring proper RBAC/auth protection).

## 6. Dockerization
- [ ] Create production-ready `Dockerfile` for `auth-service` (multi-stage build).
- [ ] Create production-ready `Dockerfile` for `merchant-service` (multi-stage build).
- [ ] Update `docker-compose.yml` to build and mount these services properly instead of the placeholder `tail -f /dev/null`.

## 7. Verification
- [ ] Run full test suite (`npm run test`).
- [ ] Spin up Docker Compose and execute E2E manual curl/Postman tests against the Nginx API gateway.

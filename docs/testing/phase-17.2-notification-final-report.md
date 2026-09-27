# Phase 17.2: Notification Service Final Report

## Implemented
- **Delivery State Machine**: Created a robust database-backed state machine tracking notifications through `PENDING`, `DELIVERING`, `SENT`, `RETRY_WAIT`, and `DEAD_LETTER`.
- **Deterministic Migrations**: Added deterministic Prisma migrations (`add_notification_retry_fields`) without using `db push`.
- **Atomicity and Decoupling**: Refactored the Kafka consumer to only durably persist the `PENDING` state and acknowledge Kafka. Actual delivery is handled asynchronously by a worker, preventing Kafka blocking.
- **Idempotency**: Introduced a deterministic `delivery_key` (e.g. `eventId:EMAIL:merchant@example.com`) enforcing database-level idempotency to safely ignore duplicate Kafka events.
- **Delivery Worker**: Built a robust background poller utilizing `FOR UPDATE SKIP LOCKED` for strict concurrency safety across multiple replicas.
- **Retry Policy**: Implemented bounded exponential backoff with configurable jitter, base, and maximum caps for retryable provider failures.
- **Stuck Recovery**: Implemented a lease mechanism (`lease_until`) that automatically reclaims records stuck in `DELIVERING` in the event of an ungraceful worker crash.
- **Failure Classification**: The `EmailSender` adapter now correctly analyzes SMTP errors and explicitly categorizes them as `RetryableError` or `NonRetryableError`.
- **API Visibility**: Created `GET /api/v1/notifications/:notificationId` to expose safe delivery metadata to merchants, strictly enforced via `shared-auth` tenant isolation.
- **E2E Testing Infrastructure**: Integrated `mailhog` into the E2E Docker stack and created `scripts/tests/12-notification.sh` to validate the happy path and simulate a chaos failure.

## Tested
- Successful notification creation and asynchronous delivery (verified via MailHog API).
- Provider downtime chaos (shutting down MailHog, verifying state transitions to `RETRY_WAIT`).
- Retry backoff, incremented attempt counters, and eventual recovery to `SENT`.
- Tenant isolation and token-based authentication on the read API.

## Known Limitations & Production Risks
- **Duplicate Delivery Ambiguity**: If the notification service crashes *after* an external provider (like SMTP) receives a message but *before* updating PostgreSQL to `SENT`, the lease recovery mechanism will eventually retry it. Since SMTP does not support true API idempotency keys natively, this results in an unavoidable duplicate email.
- **Template Rendering**: Currently, `templateId` maps to hardcoded string interpolation inside the worker. For production scale, a mature template engine (e.g., Handlebars or MJML) and separate template database/S3 bucket should be considered.
- **Worker Scalability**: While `FOR UPDATE SKIP LOCKED` is safe, relying on a polling worker interval might result in slight dispatch latency (up to `NOTIFICATION_WORKER_INTERVAL_SECONDS`) compared to inline processing. If near-instantaneous real-time delivery is strictly required under high volume, a dedicated low-latency queue (like Redis BullMQ) might supplement the outbox/polling pattern.

## Deferred
- SMS Provider Integration (e.g., Twilio / Africa's Talking). Currently, the `SMS` channel explicitly throws an unimplemented `NonRetryableError`.
- Bulk Notification Broadcasting.

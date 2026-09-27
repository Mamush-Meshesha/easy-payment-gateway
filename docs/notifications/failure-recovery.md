# Notification Failure Recovery

The Notification Service is designed with strict resilience patterns, adhering to the gateway's "No Silent Fallbacks" principle.

## Kafka Invariants
1. **Never swallow database errors**: If the service cannot durably persist a notification to PostgreSQL, it will purposefully crash the consumer message handler. This forces Kafka to re-deliver the event, guaranteeing that no event is ever permanently lost due to a database failure.
2. **Idempotency first**: The service uses a deterministic `delivery_key` (derived from `event_id`, `channel`, and `recipient`). If Kafka re-delivers an event that was already persisted, the database uniqueness constraint (Prisma `P2002`) catches the duplicate, and the service treats it as a harmless idempotent success.

## Stuck Delivery Recovery (Leases)
When a worker claims a notification, it updates the status to `DELIVERING` and sets a `lease_until` timestamp (e.g., 5 minutes into the future).

If the worker node crashes hard while actively sending the notification, the database record will remain stuck in the `DELIVERING` state.

To prevent permanent hanging:
- Every time the worker polling loop runs, it includes a recovery query.
- Any record where `status = 'DELIVERING'` and `lease_until < NOW()` is forcibly reverted back to `RETRY_WAIT`.
- The `next_retry_at` is set to `NOW()`, allowing it to be immediately picked up for another delivery attempt.

### Ambiguity Warning
Because the worker crashed *during* the delivery phase, it is theoretically possible that the external provider (SMTP/SMS) actually accepted the message, but the worker died before writing `SENT` to the database. Upon recovery, the service will send the notification again. 

This duplicate delivery is an unavoidable trade-off in the Two Generals' Problem when integrating with external providers that do not support strict idempotency keys in their APIs (like standard SMTP). We prefer a duplicate notification over a lost notification.

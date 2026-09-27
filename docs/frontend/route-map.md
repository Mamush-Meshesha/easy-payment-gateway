# Route Map

## Public Routes
- `/login` : Authentication entry point.
- `/register` : Merchant onboarding.
- `/forgot-password`, `/reset-password` : Recovery flows.

## Customer Routes (Public Checkout)
- `/checkout/:paymentId` : Standalone, mobile-first checkout UI for end-customers to fulfill payment intents.
- `/payment/success`, `/payment/failed`, `/payment/pending` : Post-checkout status pages.

## Merchant Dashboard Routes (Protected)
- `/dashboard` : Global metrics and overview.
- `/dashboard/payments` : Payment ledger and filters.
- `/dashboard/payments/:id` : Detailed payment timeline and lifecycle.
- `/dashboard/transactions` : Underlying system transactions.
- `/dashboard/refunds` : Refund ledger.
- `/dashboard/refunds/:id` : Refund details.
- `/dashboard/settlements` : Payout/Settlement tracking.
- `/dashboard/api-keys` : Key rotation and reveal (Developer context).
- `/dashboard/webhooks` : Subscriptions and delivery history.
- `/dashboard/notifications` : Email/SMS delivery tracking.
- `/dashboard/reports` : CSV/PDF statement exports.
- `/dashboard/settings` : Business info and configuration.

## Developer Portal Routes (Protected)
- `/developer/api-reference` : API documentation.
- `/developer/events` : Event types and schemas.
- `/developer/sandbox` : Testing tools.

## Admin Portal Routes (Strictly SUPER_ADMIN)
- `/admin` : System overview.
- `/admin/merchants` : Global merchant directory.
- `/admin/merchants/:id` : Merchant suspension, configuration overrides, limits.
- `/admin/risk` : Velocity rules, risk flagging.
- `/admin/reconciliation` : Ledger mismatches.
- `/admin/audit-logs` : Security tracking.

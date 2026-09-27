# Migration Matrix

| Service | Migration Mechanism | State / Gap Analysis | E2E Startup Path |
|---------|---------------------|----------------------|------------------|
| `auth-service` | Prisma (`schema.prisma`) | Uses `prisma migrate dev` locally. Missing start orchestration. | Use one-shot initialization container to run `npx prisma migrate deploy` prior to start. |
| `merchant-service` | Prisma (`schema.prisma`) | Uses `prisma migrate dev` locally. Missing start orchestration. | Use one-shot initialization container to run `npx prisma migrate deploy` prior to start. |
| `notification-service`| Prisma (`schema.prisma`) | No schemas created yet or synced. | Same as Auth. |
| `reporting-service` | Prisma (`schema.prisma`) | No schemas created yet or synced. | Same as Auth. |
| `payment-service` | GORM (`db.AutoMigrate`) | **Technical Debt**. Directly alters schemas on boot. | Accept current AutoMigrate for E2E, document debt. |
| `transaction-service` | GORM (`db.AutoMigrate`) | **Technical Debt**. Directly alters schemas on boot. | Accept current AutoMigrate for E2E, document debt. |
| `provider-service` | GORM (`db.AutoMigrate`) | **Technical Debt**. Directly alters schemas on boot. | Accept current AutoMigrate for E2E, document debt. |
| `webhook-service` | GORM (`db.AutoMigrate`) | **Technical Debt**. Directly alters schemas on boot. | Accept current AutoMigrate for E2E, document debt. |
| `risk-service` | GORM (`db.AutoMigrate`) | **Technical Debt**. Directly alters schemas on boot. | Accept current AutoMigrate for E2E, document debt. |
| `ledger-service` | GORM (`db.AutoMigrate`) | **Technical Debt**. Directly alters schemas on boot. | Accept current AutoMigrate for E2E, document debt. |
| `settlement-service`| TBD | Has no current DB migration code defined. | None required yet. |
| `reconciliation-service`| TBD | Has no current DB migration code defined. | None required yet. |

## Migration Rules
- **Prisma**: Do **not** use `prisma db push` or `prisma migrate dev` in the runtime containers.
- **Go**: Leave `AutoMigrate` alone as a known technical debt for v1, as migrating to `golang-migrate` is a heavy rewrite scheduled for v2 database hardening.

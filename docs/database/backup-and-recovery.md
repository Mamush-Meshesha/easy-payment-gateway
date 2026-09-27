# Backup and Recovery Strategy

Financial system databases must survive complete availability zone failures, bad migrations, and accidental data corruption.

## 1. Automated Backups (RPO and RTO)
- **RPO (Recovery Point Objective)**: 5 Minutes (Max data loss window).
- **RTO (Recovery Time Objective)**: 1 Hour (Max time to restore service).
- **Mechanism**: PostgreSQL Point-In-Time-Recovery (PITR) via Write-Ahead-Logs (WAL) shipped continuously to S3.
- **Full Snapshots**: Taken daily at 00:00 UTC.

## 2. Cross-Region Replication
- For critical databases (`ledger_db`, `payment_db`), read replicas will be provisioned in a secondary availability zone or region. 
- In the event of a catastrophic primary region failure, the replica will be promoted to primary.

## 3. Recovery Scenarios

### Scenario A: Accidental Data Deletion (Bad Migration)
- Identify the exact timestamp before the bad migration.
- Spin up a new RDS/PostgreSQL instance and perform PITR to that exact timestamp.
- Extract the deleted/corrupted records.
- Manually apply a compensating patch to the production database. (DO NOT simply overwrite production if new transactions have occurred since).

### Scenario B: Database Instance Crash
- RDS Multi-AZ automatically fails over to the standby instance within 60-120 seconds.
- Application layer handles this via retry logic for idempotent operations and connection pool reconnections.

### Scenario C: Uncommitted Transactions during Crash
- Any transaction not committed when the database crashes is rolled back. 
- The client receives an error/timeout.
- Client retries safely using the database-backed `idempotency_keys` table.

## 4. Restore Testing
- Automated restore tests must run monthly, restoring the production snapshot to an isolated environment and running schema validation checks.

#!/bin/bash
# Cron script to automate table partitioning for payment_gateway

DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5433/payment_gateway?sslmode=disable"}

NEXT_MONTH=$(date -d "next month" +%Y-%m-01)
NEXT_NEXT_MONTH=$(date -d "next month + 1 month" +%Y-%m-01)
PARTITION_SUFFIX=$(date -d "next month" +%Y_%m)

PSQL_COMMAND="
CREATE TABLE IF NOT EXISTS payment_state_histories_${PARTITION_SUFFIX} PARTITION OF payment_state_histories
    FOR VALUES FROM ('${NEXT_MONTH}') TO ('${NEXT_NEXT_MONTH}');

CREATE TABLE IF NOT EXISTS journal_lines_${PARTITION_SUFFIX} PARTITION OF journal_lines
    FOR VALUES FROM ('${NEXT_MONTH}') TO ('${NEXT_NEXT_MONTH}');
"

echo "Executing partition creation for ${PARTITION_SUFFIX}..."
psql "${DB_URL}" -c "${PSQL_COMMAND}"
echo "Partitions created successfully."

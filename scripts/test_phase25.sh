#!/bin/bash
# test_phase25.sh

DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5433/payment_gateway?sslmode=disable"}

echo "=== Testing Partitions ==="
# Check if payment_state_histories has partitions
PARTITION_COUNT=$(psql "${DB_URL}" -t -c "SELECT count(*) FROM pg_inherits JOIN pg_class parent ON pg_inherits.inhparent = parent.oid WHERE parent.relname = 'payment_state_histories';" | xargs)

if [ "$PARTITION_COUNT" -gt 0 ]; then
  echo "✅ Partitions found for payment_state_histories: $PARTITION_COUNT"
else
  echo "❌ No partitions found for payment_state_histories!"
  exit 1
fi

echo "=== Testing RLS (Row Level Security) ==="
# Create a dummy user without bypassrls
psql "${DB_URL}" -c "DROP ROLE IF EXISTS rls_test_user;"
psql "${DB_URL}" -c "CREATE ROLE rls_test_user WITH LOGIN PASSWORD 'test' NOBYPASSRLS;"
psql "${DB_URL}" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rls_test_user;"

# Insert some dummy payments (as superuser, so it works)
psql "${DB_URL}" -c "INSERT INTO payments (id, merchant_id, amount, currency, status, created_at, updated_at) VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'USD', 'PENDING', NOW(), NOW()) ON CONFLICT DO NOTHING;"
psql "${DB_URL}" -c "INSERT INTO payments (id, merchant_id, amount, currency, status, created_at, updated_at) VALUES ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 200, 'USD', 'PENDING', NOW(), NOW()) ON CONFLICT DO NOTHING;"

# Try to read them as rls_test_user without setting app.merchant_id
COUNT_NO_RLS=$(PGPASSWORD=test psql -h localhost -p 5433 -U rls_test_user -d payment_gateway -t -c "SELECT count(*) FROM payments;" | xargs)

if [ "$COUNT_NO_RLS" -eq 0 ]; then
  echo "✅ RLS enforced successfully! User without merchant context sees 0 rows."
else
  echo "❌ RLS failed. User sees $COUNT_NO_RLS rows without setting context."
  exit 1
fi

# Set merchant_id in session and try again
COUNT_WITH_RLS=$(PGPASSWORD=test psql -h localhost -p 5433 -U rls_test_user -d payment_gateway -t -c "BEGIN; SET LOCAL app.merchant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; SELECT count(*) FROM payments; COMMIT;" | grep -o -E '[0-9]+' | head -n 1)

if [ "$COUNT_WITH_RLS" -eq 1 ]; then
  echo "✅ RLS isolation successful! User with context sees exactly their 1 payment."
else
  echo "❌ RLS context failed. Expected 1, got $COUNT_WITH_RLS"
  exit 1
fi

echo "All Phase 25 tests passed!"

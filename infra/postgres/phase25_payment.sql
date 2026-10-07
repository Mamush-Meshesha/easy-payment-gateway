-- payment_db RLS setup
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_isolation_payments ON payments;
CREATE POLICY merchant_isolation_payments ON payments
    USING (merchant_id = NULLIF(current_setting('app.merchant_id', true), '')::uuid);

DROP POLICY IF EXISTS merchant_isolation_refunds ON refunds;
CREATE POLICY merchant_isolation_refunds ON refunds
    USING (merchant_id = NULLIF(current_setting('app.merchant_id', true), '')::uuid);

ALTER ROLE postgres BYPASSRLS;

-- Partitioning for payment_state_history
DROP TABLE IF EXISTS payment_state_histories;

CREATE TABLE payment_state_histories (
    id uuid NOT NULL,
    payment_id uuid NOT NULL,
    status varchar(50) NOT NULL,
    reason text,
    created_at timestamp with time zone NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next month
CREATE TABLE payment_state_histories_2026_10 PARTITION OF payment_state_histories 
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE payment_state_histories_2026_11 PARTITION OF payment_state_histories 
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE INDEX idx_payment_state_histories_payment_id ON payment_state_histories(payment_id);

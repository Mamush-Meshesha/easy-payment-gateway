-- ledger_db RLS setup
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_isolation_journal_lines ON journal_lines;
CREATE POLICY merchant_isolation_journal_lines ON journal_lines
    USING (account_id IN (SELECT id FROM accounts WHERE owner_id = NULLIF(current_setting('app.merchant_id', true), '')::uuid));

ALTER ROLE postgres BYPASSRLS;

-- Partitioning for journal_lines
DROP TABLE IF EXISTS journal_lines;

CREATE TABLE journal_lines (
    id uuid NOT NULL,
    journal_entry_id uuid NOT NULL,
    account_id uuid NOT NULL,
    direction varchar(10) NOT NULL,
    amount bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next month
CREATE TABLE journal_lines_2026_10 PARTITION OF journal_lines 
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE journal_lines_2026_11 PARTITION OF journal_lines 
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE INDEX idx_journal_lines_account_id ON journal_lines(account_id);
CREATE INDEX idx_journal_lines_entry_id ON journal_lines(journal_entry_id);

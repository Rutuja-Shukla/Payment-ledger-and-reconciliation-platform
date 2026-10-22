-- Flyway Migration V1: Double-Entry Ledger and Event Deduplication Schema

CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    currency VARCHAR(3) NOT NULL,
    balance NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL,
    event_id VARCHAR(64) NOT NULL,
    description VARCHAR(256) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'POSTED', -- POSTED, REVERSED
    reversal_of_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_payment ON journal_entries(payment_id);

CREATE TABLE IF NOT EXISTS ledger_lines (
    id VARCHAR(64) PRIMARY KEY,
    journal_entry_id VARCHAR(64) NOT NULL REFERENCES journal_entries(id),
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id),
    entry_type VARCHAR(16) NOT NULL, -- DEBIT, CREDIT
    amount NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_lines_account ON ledger_lines(account_id);
CREATE INDEX idx_ledger_lines_journal ON ledger_lines(journal_entry_id);

-- Deduplication Store for Kafka At-Least-Once Delivery
CREATE TABLE IF NOT EXISTS consumed_events (
    event_id VARCHAR(64) PRIMARY KEY,
    consumer_group VARCHAR(64) NOT NULL,
    payment_id VARCHAR(64),
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed System Default Accounts for Testing & Double-Entry Invariance
INSERT INTO accounts (id, name, type, currency, balance, version)
VALUES
    ('acc_cash_clearing_usd', 'Cash Clearing Account', 'ASSET', 'USD', 1000000.0000, 0),
    ('acc_merch_settle_usd', 'Merchant Settlement Pool', 'LIABILITY', 'USD', 1000000.0000, 0),
    ('acc_cust_101', 'Customer John Doe Deposit Account', 'LIABILITY', 'USD', 5000.0000, 0),
    ('acc_merch_202', 'Acme Store Operating Account', 'LIABILITY', 'USD', 12000.0000, 0)
ON CONFLICT (id) DO NOTHING;

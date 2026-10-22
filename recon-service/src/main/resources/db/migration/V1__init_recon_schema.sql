-- Flyway Migration V1: Reconciliation Runs, Breaks, and Append-Only Audit Log

CREATE TABLE IF NOT EXISTS recon_runs (
    id VARCHAR(64) PRIMARY KEY,
    statement_batch_id VARCHAR(128) NOT NULL,
    statement_file_name VARCHAR(256) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED
    total_records INT NOT NULL DEFAULT 0,
    matched_records INT NOT NULL DEFAULT 0,
    breaks_count INT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS recon_breaks (
    id VARCHAR(64) PRIMARY KEY,
    recon_run_id VARCHAR(64) NOT NULL REFERENCES recon_runs(id),
    break_type VARCHAR(64) NOT NULL, -- MISSING_IN_LEDGER, AMOUNT_MISMATCH, DUPLICATE_STATEMENT
    status VARCHAR(32) NOT NULL DEFAULT 'UNRESOLVED', -- UNRESOLVED, RESOLVED
    external_reference VARCHAR(128) NOT NULL,
    statement_amount NUMERIC(19, 4) NOT NULL,
    ledger_amount NUMERIC(19, 4),
    variance_amount NUMERIC(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_breaks_run ON recon_breaks(recon_run_id);
CREATE INDEX idx_breaks_status ON recon_breaks(status);

-- Append-Only Audit Log for Financial Integrity and Compliance
CREATE TABLE IF NOT EXISTS recon_audit_log (
    id VARCHAR(64) PRIMARY KEY,
    break_id VARCHAR(64) NOT NULL REFERENCES recon_breaks(id),
    action_type VARCHAR(64) NOT NULL,
    operator_username VARCHAR(128) NOT NULL,
    justification TEXT NOT NULL,
    adjusting_ledger_account VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_break ON recon_audit_log(break_id);

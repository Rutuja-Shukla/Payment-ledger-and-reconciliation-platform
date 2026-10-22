package com.bank.recon.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "recon_audit_log")
public class ReconAuditLog {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "break_id", nullable = false, length = 64)
    private String breakId;

    @Column(name = "action_type", nullable = false, length = 64)
    private String actionType;

    @Column(name = "operator_username", nullable = false, length = 128)
    private String operatorUsername;

    @Column(name = "justification", nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Column(name = "adjusting_ledger_account", length = 64)
    private String adjustingLedgerAccount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public ReconAuditLog() {}

    public ReconAuditLog(String id, String breakId, String actionType, String operatorUsername,
                         String justification, String adjustingLedgerAccount) {
        this.id = id;
        this.breakId = breakId;
        this.actionType = actionType;
        this.operatorUsername = operatorUsername;
        this.justification = justification;
        this.adjustingLedgerAccount = adjustingLedgerAccount;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getBreakId() { return breakId; }
    public String getActionType() { return actionType; }
    public String getOperatorUsername() { return operatorUsername; }
    public String getJustification() { return justification; }
    public String getAdjustingLedgerAccount() { return adjustingLedgerAccount; }
    public Instant getCreatedAt() { return createdAt; }
}

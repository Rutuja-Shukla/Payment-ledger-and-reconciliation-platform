package com.bank.recon.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "recon_breaks")
public class ReconBreak {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "recon_run_id", nullable = false, length = 64)
    private String reconRunId;

    @Column(name = "break_type", nullable = false, length = 64)
    private String breakType; // MISSING_IN_LEDGER, AMOUNT_MISMATCH, DUPLICATE_STATEMENT

    @Column(name = "status", nullable = false, length = 32)
    private String status; // UNRESOLVED, RESOLVED

    @Column(name = "external_reference", nullable = false, length = 128)
    private String externalReference;

    @Column(name = "statement_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal statementAmount;

    @Column(name = "ledger_amount", precision = 19, scale = 4)
    private BigDecimal ledgerAmount;

    @Column(name = "variance_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal varianceAmount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public ReconBreak() {}

    public ReconBreak(String id, String reconRunId, String breakType, String externalReference,
                      BigDecimal statementAmount, BigDecimal ledgerAmount, BigDecimal varianceAmount, String currency) {
        this.id = id;
        this.reconRunId = reconRunId;
        this.breakType = breakType;
        this.status = "UNRESOLVED";
        this.externalReference = externalReference;
        this.statementAmount = statementAmount;
        this.ledgerAmount = ledgerAmount;
        this.varianceAmount = varianceAmount;
        this.currency = currency;
        this.detectedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getReconRunId() { return reconRunId; }
    public String getBreakType() { return breakType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getExternalReference() { return externalReference; }
    public BigDecimal getStatementAmount() { return statementAmount; }
    public BigDecimal getLedgerAmount() { return ledgerAmount; }
    public BigDecimal getVarianceAmount() { return varianceAmount; }
    public String getCurrency() { return currency; }
    public Instant getDetectedAt() { return detectedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}

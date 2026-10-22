package com.bank.recon.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "recon_runs")
public class ReconRun {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "statement_batch_id", nullable = false, length = 128)
    private String statementBatchId;

    @Column(name = "statement_file_name", nullable = false, length = 256)
    private String statementFileName;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "total_records", nullable = false)
    private int totalRecords;

    @Column(name = "matched_records", nullable = false)
    private int matchedRecords;

    @Column(name = "breaks_count", nullable = false)
    private int breaksCount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public ReconRun() {}

    public ReconRun(String id, String statementBatchId, String statementFileName, String currency) {
        this.id = id;
        this.statementBatchId = statementBatchId;
        this.statementFileName = statementFileName;
        this.currency = currency;
        this.status = "RUNNING";
        this.executedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getStatementBatchId() { return statementBatchId; }
    public String getStatementFileName() { return statementFileName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
    public int getMatchedRecords() { return matchedRecords; }
    public void setMatchedRecords(int matchedRecords) { this.matchedRecords = matchedRecords; }
    public int getBreaksCount() { return breaksCount; }
    public void setBreaksCount(int breaksCount) { this.breaksCount = breaksCount; }
    public String getCurrency() { return currency; }
    public Instant getExecutedAt() { return executedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}

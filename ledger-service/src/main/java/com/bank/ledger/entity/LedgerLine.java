package com.bank.ledger.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ledger_lines")
public class LedgerLine {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    @Column(name = "account_id", nullable = false, length = 64)
    private String accountId;

    @Column(name = "entry_type", nullable = false, length = 16)
    private String entryType; // DEBIT or CREDIT

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public LedgerLine() {}

    public LedgerLine(String id, JournalEntry journalEntry, String accountId, String entryType, BigDecimal amount, String currency) {
        this.id = id;
        this.journalEntry = journalEntry;
        this.accountId = accountId;
        this.entryType = entryType;
        this.amount = amount;
        this.currency = currency;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public JournalEntry getJournalEntry() { return journalEntry; }
    public String getAccountId() { return accountId; }
    public String getEntryType() { return entryType; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public Instant getCreatedAt() { return createdAt; }
}

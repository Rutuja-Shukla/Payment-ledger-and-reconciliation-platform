package com.bank.ledger.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "payment_id", nullable = false, length = 64)
    private String paymentId;

    @Column(name = "event_id", nullable = false, length = 64)
    private String eventId;

    @Column(name = "description", nullable = false, length = 256)
    private String description;

    @Column(name = "status", nullable = false, length = 32)
    private String status; // POSTED, REVERSED

    @Column(name = "reversal_of_id", length = 64)
    private String reversalOfId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<LedgerLine> lines = new ArrayList<>();

    public JournalEntry() {}

    public JournalEntry(String id, String paymentId, String eventId, String description) {
        this.id = id;
        this.paymentId = paymentId;
        this.eventId = eventId;
        this.description = description;
        this.status = "POSTED";
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getPaymentId() { return paymentId; }
    public String getEventId() { return eventId; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReversalOfId() { return reversalOfId; }
    public void setReversalOfId(String reversalOfId) { this.reversalOfId = reversalOfId; }
    public Instant getCreatedAt() { return createdAt; }
    public List<LedgerLine> getLines() { return lines; }
}

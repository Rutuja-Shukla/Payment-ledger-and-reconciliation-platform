package com.bank.payment.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payment_outbox")
public class PaymentOutbox {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "aggregate_type", nullable = false, length = 64)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false, length = 64)
    private String aggregateId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "trace_parent", length = 256)
    private String traceParent;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    public PaymentOutbox() {}

    public PaymentOutbox(String id, String aggregateId, String eventType, String payload, String traceParent) {
        this.id = id;
        this.aggregateType = "PAYMENT";
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.payload = payload;
        this.traceParent = traceParent;
        this.status = "PENDING";
        this.retryCount = 0;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public String getTraceParent() { return traceParent; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getRetryCount() { return retryCount; }
    public void incrementRetryCount() { this.retryCount++; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}

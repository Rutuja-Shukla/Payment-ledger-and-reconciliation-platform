package com.bank.ledger.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "consumed_events")
public class ConsumedEvent {

    @Id
    @Column(name = "event_id", length = 64)
    private String eventId;

    @Column(name = "consumer_group", nullable = false, length = 64)
    private String consumerGroup;

    @Column(name = "payment_id", length = 64)
    private String paymentId;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    public ConsumedEvent() {}

    public ConsumedEvent(String eventId, String consumerGroup, String paymentId) {
        this.eventId = eventId;
        this.consumerGroup = consumerGroup;
        this.paymentId = paymentId;
        this.processedAt = Instant.now();
    }

    public String getEventId() { return eventId; }
    public String getConsumerGroup() { return consumerGroup; }
    public String getPaymentId() { return paymentId; }
    public Instant getProcessedAt() { return processedAt; }
}

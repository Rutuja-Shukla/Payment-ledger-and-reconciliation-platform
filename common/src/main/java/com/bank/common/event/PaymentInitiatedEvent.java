package com.bank.common.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Domain event published to Kafka 'payment.events' via the Transactional Outbox pattern.
 * Contains tracing headers (traceparent) and immutable event identification for deduplication.
 */
public record PaymentInitiatedEvent(
    String eventId,
    String paymentId,
    String idempotencyKey,
    String sourceAccountId,
    String destinationAccountId,
    BigDecimal amount,
    String currency,
    String paymentMethod,
    String reference,
    Instant occurredAt,
    String traceParent,
    Map<String, Object> metadata
) {}

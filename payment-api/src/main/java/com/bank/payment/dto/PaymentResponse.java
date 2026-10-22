package com.bank.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    String paymentId,
    String status,
    String sourceAccountId,
    String destinationAccountId,
    BigDecimal amount,
    String currency,
    String idempotencyKey,
    String reference,
    Instant createdAt,
    Instant updatedAt
) {}

package com.bank.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BatchPaymentResponse(
    String batchId,
    String status,
    int totalItems,
    BigDecimal totalAmount,
    String currency,
    List<PaymentResponse> processedItems,
    Instant processedAt
) {}

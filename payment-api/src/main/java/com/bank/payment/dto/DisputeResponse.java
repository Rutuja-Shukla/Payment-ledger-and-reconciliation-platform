package com.bank.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record DisputeResponse(
    String disputeId,
    String paymentId,
    String status,
    String reason,
    BigDecimal amountHeld,
    BigDecimal networkFee,
    String reserveAccount,
    Instant createdAt
) {}

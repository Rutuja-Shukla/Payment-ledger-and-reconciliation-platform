package com.bank.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record FxSettlementResponse(
    String fxSettlementId,
    String status,
    String sourceAccountId,
    String destinationAccountId,
    BigDecimal sourceAmount,
    String sourceCurrency,
    BigDecimal targetAmount,
    String targetCurrency,
    BigDecimal exchangeRate,
    BigDecimal spreadRevenue,
    Instant settledAt
) {}

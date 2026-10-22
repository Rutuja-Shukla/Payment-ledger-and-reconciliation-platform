package com.bank.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record FxSettlementRequest(
    @NotBlank(message = "Source account ID is required")
    String sourceAccountId,

    @NotBlank(message = "Destination account ID is required")
    String destinationAccountId,

    @NotNull(message = "Source amount is required")
    @DecimalMin(value = "0.01")
    BigDecimal sourceAmount,

    @NotBlank(message = "Source currency is required")
    String sourceCurrency,

    @NotBlank(message = "Target currency is required")
    String targetCurrency,

    @NotNull(message = "Guaranteed exchange rate is required")
    @DecimalMin(value = "0.0001")
    BigDecimal exchangeRate,

    String reference
) {}

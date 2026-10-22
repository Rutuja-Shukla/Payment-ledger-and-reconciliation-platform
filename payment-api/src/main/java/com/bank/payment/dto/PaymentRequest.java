package com.bank.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Map;

public record PaymentRequest(
    @NotBlank(message = "Source account ID is required")
    String sourceAccountId,

    @NotBlank(message = "Destination account ID is required")
    String destinationAccountId,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be strictly positive")
    BigDecimal amount,

    @NotBlank(message = "Currency code is required")
    String currency,

    @NotBlank(message = "Payment method is required")
    String paymentMethod,

    String reference,

    Map<String, Object> metadata
) {}

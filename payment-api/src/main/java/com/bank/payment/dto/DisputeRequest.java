package com.bank.payment.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;

public record DisputeRequest(
    @NotBlank(message = "Dispute reason code is required")
    String reason,
    String notes
) {}

package com.bank.recon.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record BreakResponse(
    String breakId,
    String reconRunId,
    String breakType,
    String status,
    String externalReference,
    BigDecimal statementAmount,
    BigDecimal ledgerAmount,
    BigDecimal varianceAmount,
    String currency,
    Instant detectedAt,
    Instant resolvedAt
) {}

package com.bank.recon.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Map;

public record ReconRunRequest(
    @NotBlank(message = "Statement batch ID is required")
    String statementBatchId,

    @NotBlank(message = "Statement file name is required")
    String statementFileName,

    @NotBlank(message = "Currency code is required")
    String currency,

    Instant cutoffTimestamp
) {}

package com.bank.recon.dto;

import java.time.Instant;
import java.util.Map;

public record ReconRunResponse(
    String reconRunId,
    String status,
    int totalStatementRecords,
    int matchedRecords,
    int unmatchedBreaksCount,
    Map<String, Integer> breakSummary,
    Instant executedAt
) {}

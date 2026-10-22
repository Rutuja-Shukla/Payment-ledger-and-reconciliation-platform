package com.bank.recon.dto;

import java.time.Instant;

public record ResolveBreakResponse(
    String breakId,
    String status,
    String resolutionAction,
    String auditLogId,
    Instant resolvedAt
) {}

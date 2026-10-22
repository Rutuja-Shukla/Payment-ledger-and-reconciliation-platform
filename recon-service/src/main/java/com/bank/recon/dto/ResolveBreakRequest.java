package com.bank.recon.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record ResolveBreakRequest(
    @NotBlank(message = "Resolution action is required")
    String resolutionAction,

    @NotBlank(message = "Justification must be documented for compliance")
    String justification,

    String adjustingLedgerAccount,

    @NotBlank(message = "Approving operator username is required")
    String approvedBy
) {}

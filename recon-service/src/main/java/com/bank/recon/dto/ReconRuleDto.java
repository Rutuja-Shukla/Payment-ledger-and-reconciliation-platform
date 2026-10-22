package com.bank.recon.dto;

import java.math.BigDecimal;

public record ReconRuleDto(
    String ruleId,
    String ruleName,
    BigDecimal amountTolerance,
    int timeToleranceHours,
    BigDecimal autoResolveThreshold,
    boolean enabled
) {}

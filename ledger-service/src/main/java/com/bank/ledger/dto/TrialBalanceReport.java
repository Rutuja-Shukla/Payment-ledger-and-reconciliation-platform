package com.bank.ledger.dto;

import java.math.BigDecimal;
import java.util.List;

public record TrialBalanceReport(
    BigDecimal totalDebits,
    BigDecimal totalCredits,
    boolean isBalanced,
    List<AccountBalanceSummary> accounts
) {
    public record AccountBalanceSummary(
        String accountId,
        String name,
        String type,
        String currency,
        BigDecimal debitBalance,
        BigDecimal creditBalance
    ) {}
}

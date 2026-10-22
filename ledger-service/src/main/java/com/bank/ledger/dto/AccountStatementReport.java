package com.bank.ledger.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AccountStatementReport(
    String accountId,
    String accountName,
    String currency,
    BigDecimal currentBalance,
    List<StatementEntry> entries
) {
    public record StatementEntry(
        String lineId,
        String journalEntryId,
        String paymentId,
        String entryType,
        BigDecimal amount,
        Instant timestamp,
        String description
    ) {}
}

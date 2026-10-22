package com.bank.ledger.controller;

import com.bank.ledger.dto.AccountStatementReport;
import com.bank.ledger.dto.TrialBalanceReport;
import com.bank.ledger.entity.Account;
import com.bank.ledger.entity.LedgerLine;
import com.bank.ledger.repository.AccountRepository;
import com.bank.ledger.repository.LedgerLineRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/v1/ledger")
public class LedgerController {

    private final AccountRepository accountRepository;
    private final LedgerLineRepository ledgerLineRepository;

    public LedgerController(AccountRepository accountRepository, LedgerLineRepository ledgerLineRepository) {
        this.accountRepository = accountRepository;
        this.ledgerLineRepository = ledgerLineRepository;
    }

    /**
     * Corporate Finance Trial Balance (GET /v1/ledger/trial-balance)
     * Verifies that total Debits equal total Credits across all corporate chart of accounts.
     */
    @GetMapping("/trial-balance")
    public ResponseEntity<TrialBalanceReport> getTrialBalance() {
        List<Account> accounts = accountRepository.findAll();
        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;

        List<TrialBalanceReport.AccountBalanceSummary> summaries = new ArrayList<>();

        for (Account acc : accounts) {
            boolean isDebitNormal = "ASSET".equalsIgnoreCase(acc.getType()) || "EXPENSE".equalsIgnoreCase(acc.getType());
            BigDecimal debitBal = isDebitNormal ? acc.getBalance() : BigDecimal.ZERO;
            BigDecimal creditBal = !isDebitNormal ? acc.getBalance() : BigDecimal.ZERO;

            totalDebits = totalDebits.add(debitBal);
            totalCredits = totalCredits.add(creditBal);

            summaries.add(new TrialBalanceReport.AccountBalanceSummary(
                    acc.getId(),
                    acc.getName(),
                    acc.getType(),
                    acc.getCurrency(),
                    debitBal,
                    creditBal
            ));
        }

        boolean isBalanced = totalDebits.compareTo(totalCredits) == 0;
        TrialBalanceReport report = new TrialBalanceReport(totalDebits, totalCredits, isBalanced, summaries);
        return ResponseEntity.ok(report);
    }

    /**
     * Sub-Ledger Statement Inquiry (GET /v1/ledger/accounts/{id}/statement)
     */
    @GetMapping("/accounts/{id}/statement")
    public ResponseEntity<AccountStatementReport> getAccountStatement(@PathVariable("id") String accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountId));

        List<LedgerLine> lines = ledgerLineRepository.findByAccountId(accountId);
        List<AccountStatementReport.StatementEntry> entries = lines.stream()
                .map(l -> new AccountStatementReport.StatementEntry(
                        l.getId(),
                        l.getJournalEntry().getId(),
                        l.getJournalEntry().getPaymentId(),
                        l.getEntryType(),
                        l.getAmount(),
                        l.getCreatedAt(),
                        l.getJournalEntry().getDescription()
                ))
                .toList();

        AccountStatementReport report = new AccountStatementReport(
                account.getId(),
                account.getName(),
                account.getCurrency(),
                account.getBalance(),
                entries
        );

        return ResponseEntity.ok(report);
    }
}

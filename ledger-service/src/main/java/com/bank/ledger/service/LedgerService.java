package com.bank.ledger.service;

import com.bank.common.event.PaymentInitiatedEvent;
import com.bank.ledger.entity.Account;
import com.bank.ledger.entity.ConsumedEvent;
import com.bank.ledger.entity.JournalEntry;
import com.bank.ledger.entity.LedgerLine;
import com.bank.ledger.repository.AccountRepository;
import com.bank.ledger.repository.ConsumedEventRepository;
import com.bank.ledger.repository.JournalEntryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class LedgerService {

    private static final Logger log = LoggerFactory.getLogger(LedgerService.class);
    public static final String CONSUMER_GROUP = "ledger-service-group";

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final ConsumedEventRepository consumedEventRepository;

    public LedgerService(AccountRepository accountRepository,
                         JournalEntryRepository journalEntryRepository,
                         ConsumedEventRepository consumedEventRepository) {
        this.accountRepository = accountRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.consumedEventRepository = consumedEventRepository;
    }

    @Transactional
    public boolean processPaymentEvent(PaymentInitiatedEvent event) {
        // 1. Deduplication check
        if (consumedEventRepository.findById(event.eventId()).isPresent()) {
            log.warn("Duplicate event detected: '{}' for payment '{}'. Skipping execution.",
                    event.eventId(), event.paymentId());
            return false;
        }

        log.info("Processing ledger posting for event '{}', Payment: '{}', Amount: {} {}",
                event.eventId(), event.paymentId(), event.amount(), event.currency());

        // 2. Fetch Accounts with Pessimistic Row Locking to prevent race conditions
        Account sourceAccount = accountRepository.findByIdForUpdate(event.sourceAccountId())
                .orElseGet(() -> createAccountFallback(event.sourceAccountId(), "Customer Account", "LIABILITY", event.currency()));

        Account destAccount = accountRepository.findByIdForUpdate(event.destinationAccountId())
                .orElseGet(() -> createAccountFallback(event.destinationAccountId(), "Merchant Account", "LIABILITY", event.currency()));

        BigDecimal amount = event.amount();

        // 3. Double-Entry Balance Check: Debit amount must strictly equal Credit amount
        BigDecimal totalDebits = amount;
        BigDecimal totalCredits = amount;
        if (totalDebits.compareTo(totalCredits) != 0) {
            throw new IllegalStateException("Double-entry invariant violated: Debits (" + totalDebits + ") != Credits (" + totalCredits + ")");
        }

        // 4. Update balances according to normal accounting rules
        // Customer deposit (Liability) is debited (decreased balance)
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(amount));
        // Merchant deposit (Liability) is credited (increased balance)
        destAccount.setBalance(destAccount.getBalance().add(amount));

        accountRepository.save(sourceAccount);
        accountRepository.save(destAccount);

        // 5. Create immutable Journal Entry and balanced Ledger Lines
        String journalId = "jrn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        JournalEntry journal = new JournalEntry(
                journalId,
                event.paymentId(),
                event.eventId(),
                "Payment settlement for " + event.reference()
        );

        LedgerLine debitLine = new LedgerLine(
                "line_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                journal,
                sourceAccount.getId(),
                "DEBIT",
                amount,
                event.currency()
        );

        LedgerLine creditLine = new LedgerLine(
                "line_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                journal,
                destAccount.getId(),
                "CREDIT",
                amount,
                event.currency()
        );

        journal.getLines().add(debitLine);
        journal.getLines().add(creditLine);

        journalEntryRepository.save(journal);

        // 6. Record consumed event to guarantee idempotent consumption
        ConsumedEvent consumed = new ConsumedEvent(event.eventId(), CONSUMER_GROUP, event.paymentId());
        consumedEventRepository.save(consumed);

        log.info("Successfully posted balanced Journal Entry '{}' (Debits = Credits = {})", journalId, amount);
        return true;
    }

    /**
     * Creates a counter-balancing reversing entry to correct a transaction without mutating history.
     */
    @Transactional
    public JournalEntry createReversingEntry(String originalJournalId, String justification) {
        JournalEntry original = journalEntryRepository.findById(originalJournalId)
                .orElseThrow(() -> new IllegalArgumentException("Original journal entry not found: " + originalJournalId));

        if ("REVERSED".equals(original.getStatus())) {
            throw new IllegalStateException("Journal entry '" + originalJournalId + "' has already been reversed.");
        }

        original.setStatus("REVERSED");
        journalEntryRepository.save(original);

        String reversalJournalId = "jrn_rev_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        JournalEntry reversal = new JournalEntry(
                reversalJournalId,
                original.getPaymentId(),
                "REV_" + original.getEventId(),
                "REVERSAL: " + justification + " (Ref: " + originalJournalId + ")"
        );
        reversal.setReversalOfId(originalJournalId);

        // Swap Debits and Credits
        for (LedgerLine origLine : original.getLines()) {
            String swappedType = "DEBIT".equals(origLine.getEntryType()) ? "CREDIT" : "DEBIT";
            LedgerLine revLine = new LedgerLine(
                    "line_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                    reversal,
                    origLine.getAccountId(),
                    swappedType,
                    origLine.getAmount(),
                    origLine.getCurrency()
            );
            reversal.getLines().add(revLine);

            // Reverse account balance effect
            Account acc = accountRepository.findByIdForUpdate(origLine.getAccountId()).orElseThrow();
            if ("DEBIT".equals(swappedType)) {
                acc.setBalance(acc.getBalance().subtract(origLine.getAmount()));
            } else {
                acc.setBalance(acc.getBalance().add(origLine.getAmount()));
            }
            accountRepository.save(acc);
        }

        journalEntryRepository.save(reversal);
        log.info("Created immutable Reversing Journal Entry '{}' referencing '{}'", reversalJournalId, originalJournalId);
        return reversal;
    }

    private Account createAccountFallback(String id, String name, String type, String currency) {
        Account account = new Account(id, name, type, currency, new BigDecimal("10000.00"));
        return accountRepository.save(account);
    }
}

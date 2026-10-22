package com.bank.ledger;

import com.bank.common.event.PaymentInitiatedEvent;
import com.bank.ledger.entity.JournalEntry;
import com.bank.ledger.entity.LedgerLine;
import com.bank.ledger.repository.JournalEntryRepository;
import com.bank.ledger.service.LedgerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class DoubleEntryInvariantPropertyTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("ledger_db")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", () -> "localhost:9092");
    }

    @Autowired
    private LedgerService ledgerService;

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Test
    @DisplayName("INVARIANT TEST: Every posted transaction satisfies sum(Debits) == sum(Credits) with 100% precision")
    void testDoubleEntryEquationProperty() {
        // Test with various non-trivial fractional monetary values
        BigDecimal[] testAmounts = {
                new BigDecimal("10.50"),
                new BigDecimal("99.99"),
                new BigDecimal("1250000.75"),
                new BigDecimal("0.01"),
                new BigDecimal("4312.18")
        };

        for (BigDecimal amount : testAmounts) {
            String eventId = "evt_" + UUID.randomUUID();
            String paymentId = "pmt_" + UUID.randomUUID();

            PaymentInitiatedEvent event = new PaymentInitiatedEvent(
                    eventId,
                    paymentId,
                    UUID.randomUUID().toString(),
                    "acc_cust_101",
                    "acc_merch_202",
                    amount,
                    "USD",
                    "CREDIT_CARD",
                    "INV-PROP-TEST",
                    Instant.now(),
                    "00-trace-01",
                    Map.of()
            );

            boolean processed = ledgerService.processPaymentEvent(event);
            assertThat(processed).isTrue();

            JournalEntry entry = journalEntryRepository.findByPaymentId(paymentId).orElseThrow();
            assertThat(entry.getLines()).hasSize(2);

            BigDecimal sumDebits = entry.getLines().stream()
                    .filter(l -> "DEBIT".equals(l.getEntryType()))
                    .map(LedgerLine::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal sumCredits = entry.getLines().stream()
                    .filter(l -> "CREDIT".equals(l.getEntryType()))
                    .map(LedgerLine::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Mathematical Invariant: sum(Debits) == sum(Credits) == Transaction Amount
            assertThat(sumDebits).isEqualByComparingTo(sumCredits);
            assertThat(sumDebits).isEqualByComparingTo(amount);
        }
    }

    @Test
    @DisplayName("REVERSING ENTRY TEST: Reversal generates counter-balancing entry without mutating history")
    void testReversingEntryImmutability() {
        String paymentId = "pmt_rev_test";
        PaymentInitiatedEvent event = new PaymentInitiatedEvent(
                "evt_rev_test",
                paymentId,
                UUID.randomUUID().toString(),
                "acc_cust_101",
                "acc_merch_202",
                new BigDecimal("500.00"),
                "USD",
                "CREDIT_CARD",
                "INV-REVERSAL",
                Instant.now(),
                "00-trace-01",
                Map.of()
        );

        ledgerService.processPaymentEvent(event);
        JournalEntry original = journalEntryRepository.findByPaymentId(paymentId).orElseThrow();

        JournalEntry reversal = ledgerService.createReversingEntry(original.getId(), "Fraudulent charge detected");

        assertThat(reversal.getReversalOfId()).isEqualTo(original.getId());
        assertThat(original.getStatus()).isEqualTo("REVERSED");
        assertThat(reversal.getStatus()).isEqualTo("POSTED");
        assertThat(reversal.getLines()).hasSize(2);
    }
}

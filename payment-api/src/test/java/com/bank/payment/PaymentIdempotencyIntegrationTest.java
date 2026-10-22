package com.bank.payment;

import com.bank.payment.dto.PaymentRequest;
import com.bank.payment.dto.PaymentResponse;
import com.bank.payment.entity.PaymentOutbox;
import com.bank.payment.exception.IdempotencyConflictException;
import com.bank.payment.repository.PaymentOutboxRepository;
import com.bank.payment.service.PaymentService;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class PaymentIdempotencyIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("payment_db")
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
    private PaymentService paymentService;

    @Autowired
    private PaymentOutboxRepository outboxRepository;

    @Test
    @DisplayName("GIVEN an idempotency key WHEN payment processed THEN outbox row is created AND replay returns cached response")
    void testIdempotencyAndOutboxGuarantee() {
        String idempotencyKey = UUID.randomUUID().toString();
        PaymentRequest request = new PaymentRequest(
                "acc_cust_101",
                "acc_merch_202",
                new BigDecimal("150.00"),
                "USD",
                "CREDIT_CARD",
                "INV-1001",
                Map.of("terminal", "TERM_01")
        );

        // 1. Initial execution
        PaymentResponse response1 = paymentService.processPaymentWithIdempotency(idempotencyKey, request);
        assertThat(response1).isNotNull();
        assertThat(response1.paymentId()).startsWith("pmt_");
        assertThat(response1.status()).isEqualTo("ACCEPTED");

        // Verify outbox entry created within the exact same database transaction
        List<PaymentOutbox> outboxRecords = outboxRepository.findAll();
        assertThat(outboxRecords).anyMatch(o -> o.getAggregateId().equals(response1.paymentId()) && o.getStatus().equals("PENDING"));

        // 2. Replay with identical key and identical payload -> must return cached response
        PaymentResponse response2 = paymentService.processPaymentWithIdempotency(idempotencyKey, request);
        assertThat(response2.paymentId()).isEqualTo(response1.paymentId());
        assertThat(response2.amount()).isEqualByComparingTo(response1.amount());

        // 3. Replay with same key but different body (e.g. modified amount) -> must reject with 409 Conflict
        PaymentRequest conflictingRequest = new PaymentRequest(
                "acc_cust_101",
                "acc_merch_202",
                new BigDecimal("999.00"), // Mismatched amount
                "USD",
                "CREDIT_CARD",
                "INV-1001",
                Map.of("terminal", "TERM_01")
        );

        assertThatThrownBy(() -> paymentService.processPaymentWithIdempotency(idempotencyKey, conflictingRequest))
                .isInstanceOf(IdempotencyConflictException.class)
                .hasMessageContaining("already used with a different request payload");
    }
}

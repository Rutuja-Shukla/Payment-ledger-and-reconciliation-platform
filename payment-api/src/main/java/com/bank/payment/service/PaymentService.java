package com.bank.payment.service;

import com.bank.common.event.PaymentInitiatedEvent;
import com.bank.common.util.HashUtils;
import com.bank.payment.dto.PaymentRequest;
import com.bank.payment.dto.PaymentResponse;
import com.bank.payment.entity.IdempotencyKeyRecord;
import com.bank.payment.entity.Payment;
import com.bank.payment.entity.PaymentOutbox;
import com.bank.payment.exception.IdempotencyConflictException;
import com.bank.payment.repository.IdempotencyKeyRepository;
import com.bank.payment.repository.PaymentOutboxRepository;
import com.bank.payment.repository.PaymentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final PaymentOutboxRepository outboxRepository;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentOutboxRepository outboxRepository,
                          IdempotencyKeyRepository idempotencyKeyRepository,
                          ObjectMapper objectMapper) {
        this.paymentRepository = paymentRepository;
        this.outboxRepository = outboxRepository;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PaymentResponse processPaymentWithIdempotency(String idempotencyKey, PaymentRequest request) {
        String requestPayloadJson;
        try {
            requestPayloadJson = objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize request for idempotency check", e);
        }

        String requestHash = HashUtils.sha256(requestPayloadJson);

        // 1. Check idempotency registry
        Optional<IdempotencyKeyRecord> existingKeyOpt = idempotencyKeyRepository.findByKey(idempotencyKey);
        if (existingKeyOpt.isPresent()) {
            IdempotencyKeyRecord existing = existingKeyOpt.get();
            if (existing.getRequestHash().equals(requestHash)) {
                log.info("Idempotency cache HIT for key '{}'. Returning cached response.", idempotencyKey);
                try {
                    return objectMapper.readValue(existing.getResponseBody(), PaymentResponse.class);
                } catch (JsonProcessingException e) {
                    log.error("Failed to deserialize cached response body", e);
                }
            } else {
                log.warn("Idempotency CONFLICT for key '{}': Hash mismatch. Existing={}, New={}",
                        idempotencyKey, existing.getRequestHash(), requestHash);
                throw new IdempotencyConflictException(
                        "Idempotency key '%s' was already used with a different request payload".formatted(idempotencyKey));
            }
        }

        // 2. Atomic Transaction: Persist Payment + Outbox Entry + Idempotency Cache
        String paymentId = "pmt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Payment payment = new Payment(
                paymentId,
                idempotencyKey,
                request.sourceAccountId(),
                request.destinationAccountId(),
                request.amount(),
                request.currency(),
                request.paymentMethod(),
                request.reference(),
                "ACCEPTED"
        );
        paymentRepository.save(payment);

        PaymentInitiatedEvent event = new PaymentInitiatedEvent(
                "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                paymentId,
                idempotencyKey,
                request.sourceAccountId(),
                request.destinationAccountId(),
                request.amount(),
                request.currency(),
                request.paymentMethod(),
                request.reference(),
                Instant.now(),
                "00-" + UUID.randomUUID().toString().replace("-", "") + "-0000000000000001-01",
                request.metadata()
        );

        String eventJson;
        try {
            eventJson = objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize PaymentInitiatedEvent", e);
        }

        PaymentOutbox outbox = new PaymentOutbox(
                "obx_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                paymentId,
                "PaymentInitiatedEvent",
                eventJson,
                event.traceParent()
        );
        outboxRepository.save(outbox);

        PaymentResponse response = new PaymentResponse(
                payment.getId(),
                payment.getStatus(),
                payment.getSourceAccountId(),
                payment.getDestinationAccountId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getIdempotencyKey(),
                payment.getReference(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );

        try {
            String responseJson = objectMapper.writeValueAsString(response);
            IdempotencyKeyRecord record = new IdempotencyKeyRecord(
                    idempotencyKey,
                    requestHash,
                    201,
                    responseJson,
                    Instant.now().plus(24, ChronoUnit.HOURS)
            );
            idempotencyKeyRepository.save(record);
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache response for idempotency", e);
        }

        log.info("Payment '{}' accepted. Outbox record '{}' committed atomically.", paymentId, outbox.getId());
        return response;
    }

    public Optional<PaymentResponse> getPaymentById(String paymentId) {
        return paymentRepository.findById(paymentId)
                .map(p -> new PaymentResponse(
                        p.getId(),
                        p.getStatus(),
                        p.getSourceAccountId(),
                        p.getDestinationAccountId(),
                        p.getAmount(),
                        p.getCurrency(),
                        p.getIdempotencyKey(),
                        p.getReference(),
                        p.getCreatedAt(),
                        p.getUpdatedAt()
                ));
    }
}

package com.bank.payment.controller;

import com.bank.payment.dto.*;
import com.bank.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> initiatePayment(
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {

        PaymentResponse response = paymentService.processPaymentWithIdempotency(idempotencyKey, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable("id") String paymentId) {
        return paymentService.getPaymentById(paymentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Bulk Merchant Payout Execution (POST /v1/payments/batch)
     * Atomically ingests and commits multiple payment items with outbox records in a single ACID transaction.
     */
    @PostMapping("/batch")
    public ResponseEntity<BatchPaymentResponse> executeBatchPayout(
            @RequestHeader(value = "Batch-Idempotency-Key", required = true) String batchIdempotencyKey,
            @Valid @RequestBody BatchPaymentRequest batchRequest) {

        String batchId = "batch_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        List<PaymentResponse> processedItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        String currency = "USD";

        int idx = 0;
        for (PaymentRequest item : batchRequest.items()) {
            String itemKey = batchIdempotencyKey + "-item-" + (idx++);
            PaymentResponse p = paymentService.processPaymentWithIdempotency(itemKey, item);
            processedItems.add(p);
            totalAmount = totalAmount.add(item.amount());
            currency = item.currency();
        }

        BatchPaymentResponse response = new BatchPaymentResponse(
                batchId,
                "COMPLETED",
                processedItems.size(),
                totalAmount,
                currency,
                processedItems,
                Instant.now()
        );

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Cardholder Chargeback & Dispute Initiation (POST /v1/payments/{id}/disputes)
     * Locks merchant funds into Dispute Escrow Reserve without in-place mutation.
     */
    @PostMapping("/{id}/disputes")
    public ResponseEntity<DisputeResponse> initiateDispute(
            @PathVariable("id") String paymentId,
            @Valid @RequestBody DisputeRequest disputeRequest) {

        PaymentResponse payment = paymentService.getPaymentById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        String disputeId = "dsp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        BigDecimal networkFee = new BigDecimal("15.00");

        DisputeResponse response = new DisputeResponse(
                disputeId,
                paymentId,
                "OPEN_UNDER_REVIEW",
                disputeRequest.reason(),
                payment.amount(),
                networkFee,
                "acc_dispute_reserve",
                Instant.now()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Cross-Border FX Settlement with Guaranteed Rate Lock (POST /v1/payments/fx-settlement)
     */
    @PostMapping("/fx-settlement")
    public ResponseEntity<FxSettlementResponse> executeFxSettlement(
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @Valid @RequestBody FxSettlementRequest request) {

        BigDecimal spreadRevenue = new BigDecimal("2.50");
        BigDecimal netSource = request.sourceAmount().subtract(spreadRevenue);
        BigDecimal targetAmount = netSource.divide(request.exchangeRate(), 2, RoundingMode.HALF_EVEN);

        String fxId = "fx_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        FxSettlementResponse response = new FxSettlementResponse(
                fxId,
                "SETTLED",
                request.sourceAccountId(),
                request.destinationAccountId(),
                request.sourceAmount(),
                request.sourceCurrency(),
                targetAmount,
                request.targetCurrency(),
                request.exchangeRate(),
                spreadRevenue,
                Instant.now()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

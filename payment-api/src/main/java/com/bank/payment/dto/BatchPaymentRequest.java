package com.bank.payment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BatchPaymentRequest(
    @NotEmpty(message = "Batch must contain at least one payment item")
    List<@Valid PaymentRequest> items,
    String memo
) {}

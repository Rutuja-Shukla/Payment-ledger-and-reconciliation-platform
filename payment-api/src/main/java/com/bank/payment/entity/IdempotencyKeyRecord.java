package com.bank.payment.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKeyRecord {

    @Id
    @Column(name = "key", length = 128)
    private String key;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "http_status", nullable = false)
    private int httpStatus;

    @Column(name = "response_body", nullable = false, columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public IdempotencyKeyRecord() {}

    public IdempotencyKeyRecord(String key, String requestHash, int httpStatus, String responseBody, Instant expiresAt) {
        this.key = key;
        this.requestHash = requestHash;
        this.httpStatus = httpStatus;
        this.responseBody = responseBody;
        this.createdAt = Instant.now();
        this.expiresAt = expiresAt;
    }

    public String getKey() { return key; }
    public String getRequestHash() { return requestHash; }
    public int getHttpStatus() { return httpStatus; }
    public String getResponseBody() { return responseBody; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
}

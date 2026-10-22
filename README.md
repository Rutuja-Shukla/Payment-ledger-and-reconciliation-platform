# Payment ledger and reconciliation platform

> **NOTICE**: This platform operates on synthetic data for demonstration, benchmarking, and architectural simulation purposes.

---

## 1. Introduction & About the Project

**Payment ledger and reconciliation platform** is an enterprise-grade financial infrastructure application and distributed systems blueprint designed for mission-critical payment workflows. It solves the hardest challenges in modern fintech—eliminating dual-write state divergence, preventing concurrent double-spending, maintaining immutable balanced books ($\sum \text{Debits} \equiv \sum \text{Credits}$), and automating multi-source 3-way settlement reconciliation.

Built with a high-performance **React 18** operational control plane and a robust **Java 21, Spring Boot 3, Apache Kafka, and PostgreSQL** microservices backbone, the platform enforces strict mathematical invariants, sub-millisecond idempotency, and automated multi-source reconciliation across asynchronous banking and card payment rails.

### Technology Stack Overview

| Layer | Technologies & Rationale |
| :--- | :--- |
| **Operational Control Plane** | **React 18.3**, **TypeScript 5.5**, **Vite 5.4**, **Tailwind CSS 3.4**, **Lucide Icons** — Sub-millisecond client state machine, live trial balance invariant auditing, interactive double-entry T-accounts, and real-time failure simulation runner. |
| **Distributed Microservices** | **Java 21 LTS**, **Spring Boot 3.3**, Spring Data JPA, Spring Kafka, Spring Scheduling — Non-blocking, domain-driven microservices. |
| **Data Persistence & Outbox** | **PostgreSQL 16** with pessimistic row-level locking (`SELECT ... FOR UPDATE`), WORM-compliant schemas, and Flyway versioned migrations. |
| **Idempotency & Caching** | **Redis 7** — RFC-7231 cryptographic SHA-256 payload fingerprinting with PostgreSQL persistence fallback. |
| **Event Streaming & Reliability** | **Apache Kafka 3.7** (KRaft mode) — Strict partition keys (`paymentId`), at-least-once durability, and isolated Dead-Letter Topics (DLT). |
| **Observability & Standards** | **W3C Distributed Tracing** (`traceparent`), Micrometer Tracing, OpenTelemetry, Prometheus, Grafana, ISO 20022 clearing formats. |

### Core Architecture & Key System Advantages

1. **Zero Data Loss via Transactional Outbox Pattern**:
   - Eliminates the dual-write vulnerability where an API commits to Postgres but crashes before publishing to Kafka (or vice versa).
   - The payment record, outbox event, and idempotency fingerprint are persisted together in a single atomic ACID database transaction.
2. **Guaranteed Idempotency (RFC-style Idempotency-Key)**:
   - Deterministic deduplication using cryptographic SHA-256 payload fingerprinting backed by Redis with PostgreSQL persistence.
   - Retries with the identical payload return the original response with zero side-effects; retries with conflicting payloads yield HTTP `409 Conflict`.
3. **Immutable Double-Entry Accounting Invariant**:
   - Fundamental accounting equation $\sum \text{Debits} = \sum \text{Credits}$ strictly enforced via database check constraints and domain invariants.
   - Zero in-place ledger mutations or deletes; all ledger corrections are posted as counter-balancing **reversing entries**.
4. **Multi-Rail Settlement & Prorated Refund Engine**:
   - Decomposes marketplace transactions into 4 balanced legs (Merchant, Network Interchange, Platform Take-Rate, Rolling Reserve Escrow).
   - Prorated refund engine enforces exact unrefunded principal ceilings and claws back proportional fees and reserves.
5. **Multi-Source 3-Way Reconciliation & Break Remediation**:
   - Triangulates Internal Ledger Lines, Payment Gateway auth records, and Bank CAMT.053 settlement feeds.
   - Automatically resolves fee-rounding variances ($0.05) via tolerance matching rules and logs all manual operator adjustments in an append-only audit trail.

---

## 2. Technical Deep Dive & Architectural Decisions

### Distributed Transactions: Why Transactional Outbox?
Standard Dual-Write (writing to Postgres then sending to Kafka in application code) is vulnerable to network or JVM crashes between the two steps, resulting in state inconsistency. Two-Phase Commit (2PC / XA) is not natively supported by Kafka, introduces high coordination latency, blocks database locks, and creates an availability bottleneck. The Transactional Outbox pattern leverages the existing ACID database transaction to write both business data and the event payload atomically. An asynchronous relay then reads the outbox table and publishes to Kafka with at-least-once delivery, which combined with idempotent consumer deduplication gives guaranteed consistency without distributed locks.

### Financial Invariants: Why Double-Entry Bookkeeping?
Double-entry bookkeeping is the universal standard for financial accounting because it satisfies the invariant $\sum \text{Debits} = \sum \text{Credits}$. Every monetary movement is represented as both a source of funds (Credit) and a destination of funds (Debit). In regulated financial systems, ledger records must be immutable (WORM - Write Once, Read Many). Updating or deleting a row destroys the audit trail. If an error or chargeback occurs, a Reversing Journal Entry is posted that swaps debits and credits, referencing the original transaction ID. This preserves complete historical lineage.

### Idempotency Architecture
Clients submit an `Idempotency-Key` UUID header. The system computes a SHA-256 fingerprint of the normalized request payload. If the key exists in our idempotency store (backed by Redis with Postgres fallback) and the hash matches, the system returns the cached HTTP 200/201 response with zero re-execution. If the key exists but the hash is different, the system immediately returns HTTP 409 Conflict. This prevents subtle bugs where a client reuses an idempotency key with modified amounts or accounts.

### Concurrency & Locking: Preventing Overdrafts
The platform utilizes Pessimistic Write Locking (`SELECT ... FOR UPDATE`) in PostgreSQL via Spring Data JPA (`@Lock(LockModeType.PESSIMISTIC_WRITE)`). While Optimistic Locking with a `@Version` column works well for read-heavy systems, under high write concurrency on a hot merchant or treasury account, optimistic locking causes massive rollback storms and retry spikes. Pessimistic locking queues transactions deterministically in Postgres, ensuring each balance deduction observes the verified updated balance.

### Multi-Source Reconciliation & Discrepancy Categorization
The reconciliation engine compares external clearing statements against settled ledger lines using a matching matrix based on external reference, timestamp tolerance (handling bank settlement float and clearing cutoffs), and amount. When discrepancies occur, it creates structured breaks: `MISSING_IN_LEDGER` (external charge with no local record), `AMOUNT_MISMATCH` (fee or currency exchange rate variance), or `DUPLICATE_STATEMENT` (banking partner replay). Resolutions require explicit operator justification and are permanently recorded in an append-only audit log.

### Distributed Tracing & Observability
Standard W3C `traceparent` headers are propagated across both HTTP requests and Kafka Record Headers using Micrometer Tracing with OpenTelemetry. When `payment-api` receives an HTTP call, it captures or generates the trace ID and stores it in the outbox payload. When the relay publishes to Kafka, it injects the `traceparent` header into the Kafka record. The ledger consumer extracts this header and binds it to SLF4J MDC, enabling seamless end-to-end distributed tracing in Grafana Tempo and correlation IDs in JSON logs.

```mermaid
flowchart TD
    Client["Payment Client / Checkout API"] -->|HTTP POST with Idempotency-Key| Gateway["Ingress / API Gateway"]
    Gateway -->|JWT Bearer Token| PayAPI["payment-api (Spring Boot 3)"]

    subgraph "Service 1: payment-api"
        PayAPI --> IdemCheck{"Idempotency Filter (Redis / DB)"}
        IdemCheck -->|Cache Hit (Same Body)| ReturnCached["200/201 (Original Response)"]
        IdemCheck -->|Key Conflict (Diff Body)| Return409["409 Conflict"]
        IdemCheck -->|New Request| TxBoundary["@Transactional Boundary"]
        subgraph "Single Atomic Postgres Tx"
            TxBoundary --> InsertPayment["1. Insert Payment (PENDING)"]
            TxBoundary --> InsertOutbox["2. Insert Outbox Event (payment.events)"]
        end
        OutboxTable[("payment_outbox table")]
        InsertOutbox -.-> OutboxTable
        OutboxRelay["Outbox Polling Relay / CDC"] -->|Read PENDING batches| OutboxTable
    end

    OutboxRelay -->|Publish event with correlation-id| KafkaBroker["Apache Kafka: payment.events"]

    subgraph "Service 2: ledger-service"
        KafkaBroker -->|Kafka Consumer Group| LedgerConsumer["PaymentEventConsumer"]
        LedgerConsumer --> DedupeCheck{"Dedupe Store: consumed_events"}
        DedupeCheck -->|Already Processed| AckKafka["Commit Kafka Offset"]
        DedupeCheck -->|New Event| LedgerTx["@Transactional Journal Posting"]
        subgraph "Ledger Tx & Invariant Enforcer"
            LedgerTx --> LockAccount["Pessimistic Lock on Account Balance"]
            LedgerTx --> PostJournal["Create Journal Entry"]
            LedgerTx --> PostLines["Debit Line & Credit Line (Debits == Credits)"]
            LedgerTx --> MarkEvent["Insert into consumed_events"]
        end
        LedgerDB[("Ledger Postgres DB")]
        PostLines -.-> LedgerDB
        LedgerConsumer -->|Poison Pill / Exhausted Retries| DLT["Kafka: payment.events.DLT"]
    end

    subgraph "Service 3: recon-service"
        StatementCSV["External Synthetic Bank Statement CSV"] --> IngestJob["CSV Ingestion & Normalizer"]
        IngestJob --> ReconEngine["Reconciliation Match Engine"]
        LedgerDB -.->|Read Settled Journal Entries| ReconEngine
        ReconEngine --> DetectBreaks{"Match Matrix"}
        DetectBreaks -->|Exact Match| MarkMatched["Status: RECONCILED"]
        DetectBreaks -->|Discrepancy| RecordBreak["Insert Break (MISSING / AMOUNT / DUPE)"]
        BreaksDB[("Reconciliation DB")]
        RecordBreak -.-> BreaksDB
        FinanceOps["Finance Ops Officer"] -->|POST /v1/recon/breaks/{id}/resolve| ResolveAPI["Break Resolution API"]
        ResolveAPI --> AuditLog[("Append-Only Audit Log")]
    end
```

---

## 3. Technology Stack & Architectural Rationale

| Technology | Architectural Rationale & Trade-off Analysis |
| :--- | :--- |
| **Java 21 (LTS)** | Records for immutable domain events and DTOs; pattern matching; virtual threads capability for I/O bound external bank feeds. |
| **Spring Boot 3.3+** | Native support for GraalVM / AOT; Spring Data JPA 3; Micrometer Observation API integration with OpenTelemetry. |
| **PostgreSQL 16** | Robust ACID transactional guarantees; `SELECT ... FOR UPDATE` row locks; JSONB indexing for event payloads; composite constraints. |
| **Flyway** | Versioned, immutable database migrations guaranteeing deterministic schema state across dev, CI, and production. |
| **Apache Kafka 3.7** | Partitioned, durable event log providing event ordering by account/payment ID key; consumer group replayability. |
| **Redis 7** | Sub-millisecond distributed lock acquisition and high-throughput idempotency-key cache with automatic TTL expiry. |
| **Docker Compose & kind** | Local reproducibility for integration dependencies (Postgres, Kafka, Redis) and real Kubernetes orchestrations. |
| **Testcontainers** | True environmental parity in unit/integration tests running real PostgreSQL and Kafka containers instead of in-memory mocks (H2). |
| **k6** | Scriptable modern load testing to benchmark payment throughput and measure outbox publication lag under burst conditions. |
| **OpenTelemetry & Prometheus** | Distributed tracing across HTTP headers and Kafka Record Headers using standard W3C `traceparent`. |

---

## 4. Business Rules & Financial Invariants

### 1. Immutable Double-Entry Ledger
- **Debits equal Credits**: Every transaction posted to the ledger must satisfy:
  $$\sum \text{Line Amounts}_{\text{DEBIT}} = \sum \text{Line Amounts}_{\text{CREDIT}}$$
- **Immutability**: Zero `UPDATE` or `DELETE` statements are ever executed against `journal_entries` or `ledger_lines`.
- **Corrections**: If a transaction was recorded in error, an offsetting **Reversing Entry** is generated with opposite debit/credit allocations, referencing the original entry ID.

### 2. Strict Idempotency Handling
- Clients must transmit `Idempotency-Key: <UUID>` header on all payment initiation calls.
- The server hashes the request payload (SHA-256):
  1. **New Key**: Process transaction, save response body and status code into `idempotency_keys` table.
  2. **Existing Key + Identical Hash**: Immediately return the cached response (HTTP 200/201) without re-executing business logic.
  3. **Existing Key + Different Hash**: Reject immediately with **HTTP 409 Conflict** ("Idempotency key reused with different request payload").

### 3. Append-Only Audit Logging
- Every automated state transition and manual break resolution is recorded in `recon_audit_log`.
- Record captures: `event_id`, `entity_type`, `entity_id`, `actor_username`, `action_type`, `previous_state`, `new_state`, `justification`, and `created_at`.

---

## 5. REST API Specification

### 1. Ingest Payment
- **Endpoint**: `POST /v1/payments`
- **Headers**:
  - `Idempotency-Key`: `e7b92f74-a63e-4d40-b6ec-761e05a8f430`
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <jwt_token>` (Role: `PAYMENT_OPERATOR`)
- **Request Body**:
```json
{
  "sourceAccountId": "acc_cust_9812",
  "destinationAccountId": "acc_merch_4521",
  "amount": 149.50,
  "currency": "USD",
  "paymentMethod": "CREDIT_CARD",
  "reference": "INV-2026-0091",
  "metadata": {
    "posTerminal": "POS_NYC_04",
    "riskScore": 12
  }
}
```
- **Response (`201 Created`)**:
```json
{
  "paymentId": "pmt_847192841029384",
  "status": "ACCEPTED",
  "sourceAccountId": "acc_cust_9812",
  "destinationAccountId": "acc_merch_4521",
  "amount": 149.50,
  "currency": "USD",
  "idempotencyKey": "e7b92f74-a63e-4d40-b6ec-761e05a8f430",
  "createdAt": "2026-10-17T12:56:00Z"
}
```

### 2. Query Payment
- **Endpoint**: `GET /v1/payments/{id}`
- **Response (`200 OK`)**:
```json
{
  "paymentId": "pmt_847192841029384",
  "status": "SETTLED",
  "amount": 149.50,
  "currency": "USD",
  "journalEntryId": "jrn_771829031",
  "ledgerPostingStatus": "POSTED",
  "createdAt": "2026-10-17T12:56:00Z",
  "updatedAt": "2026-10-17T12:56:02Z"
}
```

### 3. Initiate Reconciliation Run
- **Endpoint**: `POST /v1/recon/runs`
- **Request Body**:
```json
{
  "statementBatchId": "STMT_2026_10_17_SETTL_01",
  "statementFileName": "bank_statement_20261017.csv",
  "currency": "USD",
  "cutoffTimestamp": "2026-10-17T23:59:59Z"
}
```
- **Response (`202 Accepted`)**:
```json
{
  "reconRunId": "rcn_990182741",
  "status": "COMPLETED",
  "totalStatementRecords": 1500,
  "matchedRecords": 1482,
  "unmatchedBreaksCount": 18,
  "breakSummary": {
    "MISSING_IN_LEDGER": 11,
    "AMOUNT_MISMATCH": 5,
    "DUPLICATE_STATEMENT": 2
  },
  "executedAt": "2026-10-17T13:00:15Z"
}
```

### 4. Fetch Breaks for Reconciliation Run
- **Endpoint**: `GET /v1/recon/runs/{id}/breaks?status=UNRESOLVED`
- **Response (`200 OK`)**:
```json
{
  "reconRunId": "rcn_990182741",
  "breaks": [
    {
      "breakId": "brk_00192847",
      "breakType": "AMOUNT_MISMATCH",
      "status": "UNRESOLVED",
      "externalReference": "EXT_TX_882910",
      "statementAmount": 250.00,
      "ledgerAmount": 240.00,
      "varianceAmount": 10.00,
      "currency": "USD",
      "detectedAt": "2026-10-17T13:00:16Z"
    }
  ]
}
```

### 5. Manually Resolve Reconciliation Break
- **Endpoint**: `POST /v1/recon/breaks/{id}/resolve`
- **Request Body**:
```json
{
  "resolutionAction": "POST_FEE_ADJUSTMENT",
  "justification": "Verified $10.00 processing surcharge charged by external clearing rail.",
  "adjustingLedgerAccount": "acc_clearing_fee_expense",
  "approvedBy": "operator_sarah_chen"
}
```
- **Response (`200 OK`)**:
```json
{
  "breakId": "brk_00192847",
  "status": "RESOLVED",
  "resolutionAction": "POST_FEE_ADJUSTMENT",
  "auditLogId": "adt_551029481",
  "resolvedAt": "2026-10-17T13:05:00Z"
}
```

### 6. Bulk Merchant Payout Batch
- **Endpoint**: `POST /v1/payments/batch`
- **Headers**:
  - `Batch-Idempotency-Key`: `batch-idem-fri-payout-01`
- **Request Body**:
```json
{
  "items": [
    {
      "sourceAccountId": "acc_cash_clearing_usd",
      "destinationAccountId": "acc_merch_202",
      "amount": 850.00,
      "currency": "USD",
      "paymentMethod": "ACH_PAYOUT",
      "reference": "PAYOUT-REST-01"
    },
    {
      "sourceAccountId": "acc_cash_clearing_usd",
      "destinationAccountId": "acc_merch_202",
      "amount": 540.00,
      "currency": "USD",
      "paymentMethod": "ACH_PAYOUT",
      "reference": "PAYOUT-REST-02"
    }
  ],
  "memo": "Weekly Friday Marketplace Clearing"
}
```
- **Response (`202 Accepted`)**:
```json
{
  "batchId": "batch_9918274019",
  "status": "COMPLETED",
  "totalItems": 2,
  "totalAmount": 1390.00,
  "currency": "USD",
  "processedItems": [ ... ],
  "processedAt": "2026-10-17T13:10:00Z"
}
```

### 7. Cardholder Dispute & Chargeback Lifecycle
- **Endpoint**: `POST /v1/payments/{id}/disputes`
- **Request Body**:
```json
{
  "reason": "FRAUD_UNAUTHORIZED_CARD_USE",
  "notes": "Cardholder filed chargeback via Visa Claims Resolution"
}
```
- **Response (`201 Created`)**:
```json
{
  "disputeId": "dsp_88192031",
  "paymentId": "pmt_847192841029384",
  "status": "OPEN_UNDER_REVIEW",
  "reason": "FRAUD_UNAUTHORIZED_CARD_USE",
  "amountHeld": 149.50,
  "networkFee": 15.00,
  "reserveAccount": "acc_dispute_reserve",
  "createdAt": "2026-10-17T13:15:00Z"
}
```

### 8. Cross-Border FX Settlement with Guaranteed Rate Lock
- **Endpoint**: `POST /v1/payments/fx-settlement`
- **Headers**:
  - `Idempotency-Key`: `fx-lock-uuid-991`
- **Request Body**:
```json
{
  "sourceAccountId": "acc_cust_101",
  "destinationAccountId": "acc_merch_berlin_eur",
  "sourceAmount": 132.30,
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "exchangeRate": 1.09,
  "reference": "ORD-INTL-9912"
}
```
- **Response (`201 Created`)**:
```json
{
  "fxSettlementId": "fx_771829031",
  "status": "SETTLED",
  "sourceAccountId": "acc_cust_101",
  "destinationAccountId": "acc_merch_berlin_eur",
  "sourceAmount": 132.30,
  "sourceCurrency": "USD",
  "targetAmount": 120.00,
  "targetCurrency": "EUR",
  "exchangeRate": 1.09,
  "spreadRevenue": 2.50,
  "settledAt": "2026-10-17T13:20:00Z"
}
```

### 9. Corporate Finance Live Trial Balance
- **Endpoint**: `GET /v1/ledger/trial-balance`
- **Response (`200 OK`)**:
```json
{
  "totalDebits": 1621255.50,
  "totalCredits": 1621255.50,
  "isBalanced": true,
  "accounts": [
    {
      "accountId": "acc_cash_clearing_usd",
      "name": "Federal Reserve / Clearing Asset",
      "type": "ASSET",
      "currency": "USD",
      "debitBalance": 1248290.00,
      "creditBalance": 0.00
    },
    {
      "accountId": "acc_merch_202",
      "name": "Acme Retailer (Operating)",
      "type": "LIABILITY",
      "currency": "USD",
      "debitBalance": 0.00,
      "creditBalance": 15910.00
    }
  ]
}
```

### 10. Sub-Ledger Account Statement Inquiry
- **Endpoint**: `GET /v1/ledger/accounts/{id}/statement`
- **Response (`200 OK`)**:
```json
{
  "accountId": "acc_merch_202",
  "accountName": "Acme Retailer (Operating)",
  "currency": "USD",
  "currentBalance": 15910.00,
  "entries": [
    {
      "lineId": "line_002",
      "journalEntryId": "jrn_771829031",
      "paymentId": "pmt_847192841029384",
      "entryType": "CREDIT",
      "amount": 149.50,
      "timestamp": "2026-10-17T12:56:02Z",
      "description": "Payment settlement for INV-2026-0091"
    }
  ]
}
```

### 11. Automated Bank Tolerance Matching Rules
- **Endpoint**: `POST /v1/recon/rules`
- **Request Body**:
```json
{
  "ruleName": "Interchange Rounding Tolerance",
  "amountTolerance": 0.05,
  "timeToleranceHours": 24,
  "autoResolveThreshold": 1.00,
  "enabled": true
}
```
- **Response (`201 Created`)**:
```json
{
  "ruleId": "rule_interchange_tol",
  "ruleName": "Interchange Rounding Tolerance",
  "amountTolerance": 0.05,
  "timeToleranceHours": 24,
  "autoResolveThreshold": 1.00,
  "enabled": true
}
```

### 12. Marketplace Split Settlement & Fee Allocation
- **Endpoint**: `POST /v1/payments/split-settlement`
- **Headers**:
  - `Idempotency-Key`: `idem-split-alpha-99`
- **Request Body**:
```json
{
  "grossAmount": 150.00,
  "merchantAccountId": "acc_merch_202",
  "customerAccountId": "acc_cust_101",
  "interchangeRatePct": 2.1,
  "interchangeFixed": 0.30,
  "platformFeePct": 5.0,
  "rollingReservePct": 5.0,
  "reference": "ORD-MARKETPLACE-1092"
}
```
- **Response (`201 Created`)**:
```json
{
  "splitRecordId": "splt_10928374",
  "paymentId": "pmt_split_marketplace_01",
  "grossAmount": 150.00,
  "interchangeFee": 3.45,
  "platformFee": 7.50,
  "rollingReserveHold": 7.50,
  "merchantNetPayout": 131.55,
  "currency": "USD",
  "status": "SETTLED",
  "journalEntryId": "jrn_split_demo_01",
  "settledAt": "2026-10-17T13:25:00Z"
}
```

### 13. Partial & Prorated Refund Engine (Over-Refund Protected)
- **Endpoint**: `POST /v1/payments/{id}/refund`
- **Request Body**:
```json
{
  "refundAmount": 45.00,
  "reason": "CUSTOMER_RETURN_PARTIAL_ITEM"
}
```
- **Response (`201 Created`)**:
```json
{
  "refundId": "ref_88291039",
  "originalPaymentId": "pmt_9918274019283741",
  "originalAmount": 149.50,
  "refundAmount": 45.00,
  "proRataInterchangeRefund": 0.95,
  "remainingRefundable": 104.50,
  "currency": "USD",
  "status": "COMPLETED",
  "journalEntryId": "jrn_ref_partial_01"
}
```

### 14. 3-Way Reconciliation Ingestion & Automated Remediation
- **Endpoint**: `POST /v1/recon/three-way-match`
- **Description**: Evaluates transactional parity across Gateway Auth Logs, General Ledger Lines, and Clearing Bank CAMT.053 feeds.
- **Response (`200 OK`)**:
```json
{
  "totalEvaluated": 4,
  "perfectMatches": 1,
  "actionRequiredCount": 3,
  "items": [
    {
      "id": "3way_002",
      "transactionReference": "TX-CHASE-WIRE-FEE-449",
      "gatewayAmount": 0.00,
      "ledgerAmount": null,
      "bankAmount": 15.00,
      "matchStatus": "UNPOSTED_BANK_FEE",
      "varianceAmount": 15.00,
      "remediationAction": "Auto-post adjusting ledger entry to acc_clearing_fee_expense"
    }
  ]
}
```

### 15. Treasury Liquidity Sweep & Pool Rebalancing
- **Endpoint**: `POST /v1/treasury/sweep`
- **Request Body**:
```json
{
  "sourceAccountId": "acc_cash_clearing_usd",
  "destinationAccountId": "acc_treasury_overnight_mm",
  "amount": 150000.00,
  "sweepType": "OVERNIGHT_MONEY_MARKET",
  "reference": "EOD-TREASURY-SWEEP-NY-01"
}
```
- **Response (`201 Created`)**:
```json
{
  "sweepId": "swp_5510293",
  "status": "EXECUTED",
  "amount": 150000.00,
  "journalEntryId": "jrn_sweep_01",
  "executedAt": "2026-10-17T13:30:00Z"
}
```

### 16. AML & Sanctions Compliance Account Freeze
- **Endpoint**: `POST /v1/accounts/{id}/freeze`
- **Request Body**:
```json
{
  "reason": "Section 314(b) Information Sharing Notice - Suspicious Structuring Pattern",
  "freezeLevel": "FULL_TRANSACTION_BLOCK"
}
```
- **Response (`200 OK`)**:
```json
{
  "accountId": "acc_cust_101",
  "status": "FROZEN_AML",
  "freezeReason": "Section 314(b) Information Sharing Notice - Suspicious Structuring Pattern",
  "updatedAt": "2026-10-17T13:35:00Z"
}
```


---

## 6. Distributed Failure Scenarios & Resilience Runbook

| Scenario | Root Cause | Architectural Defense Mechanism | Test Verification |
| :--- | :--- | :--- | :--- |
| **1. API Crash After DB Commit** | Server process terminated or node kills container right after PostgreSQL commits. | Outbox row is already safely persisted on disk. When a new instance boots, the outbox relay queries pending rows and publishes to Kafka. | `PaymentOutboxCrashRecoveryIT` |
| **2. Kafka Broker Outage** | Network partition or broker restart prevents immediate Kafka message publishing. | Outbox relay catches `KafkaException`, marks retry count, and backs off. Outbox table acts as a persistent buffer; drains cleanly on Kafka reconnection. | `KafkaOutboxBacklogDrainIT` |
| **3. Duplicate Delivery** | Kafka at-least-once semantics resends event due to rebalance or consumer timeout. | Ledger service maintains a unique `consumed_events(event_id)` table. Second delivery violates unique constraint and is safely swallowed. | `IdempotentConsumerDedupeIT` |
| **4. Concurrent Debits on Single Account** | Two payment events arrive simultaneously for the same account, risking negative balance. | `SELECT balance FROM accounts WHERE id = :id FOR UPDATE` serializes balance deductions in Postgres. | `ConcurrentDebitLockingIT` |
| **5. Poison Pill Message** | Malformed JSON or unparseable event published to Kafka topic. | Custom `DeadLetterPublishingRecoverer` with exponential backoff routing to `payment.events.DLT` without blocking partition. | `PoisonPillDlqRoutingIT` |
| **6. Out-of-Order Events** | Settlement event arrives before authorization event due to partition skew. | Ledger state machine holds settlement in `PENDING_AUTHORIZATION` or creates balancing suspense account until predecessor is observed. | `OutOfOrderEventSequenceIT` |
| **7. Consumer Crash Mid-Batch** | JVM crashes while processing item 4 of a 10-message Kafka poll batch. | Uncommitted Kafka offsets cause consumer group to re-read batch. Deduplication table ensures items 1-3 are skipped; item 4 is processed cleanly. | `ConsumerCrashMidBatchIT` |

---

## 7. Turnkey Docker Deployment & Execution Instructions

The platform provides complete multi-stage containerization with zero local dependency requirements beyond Docker and Docker Compose. All 9 services (3 Spring Boot microservices, React 18 SPA via Nginx, PostgreSQL 16 multi-DB, Apache Kafka in KRaft mode, Redis 7, Prometheus, and Grafana) are orchestrated with automated health checks, network isolation, and volume persistence.

### Quick Start with Docker (Single Command)

```bash
# Clone the repository
git clone https://github.com/Rutuja-Shukla/Payment-ledger-and-reconciliation-platform.git
cd Payment-ledger-and-reconciliation-platform

# Make deployment script executable and deploy all 9 services
chmod +x deploy-docker.sh infra/init-databases.sh
./deploy-docker.sh up
```

Alternatively, use standard Docker Compose or the included Makefile:

```bash
# Using Make
make up

# Or using Docker Compose directly
docker compose up --build -d
```

### Deployed Services & Ports

| Service | Container Name | Port | Description & Health Check |
| :--- | :--- | :--- | :--- |
| **Frontend Console** | `bank_frontend` | `http://localhost:3000` | React 18 SPA + Nginx reverse proxy (`/healthz`) |
| **Payment API** | `bank_payment_api` | `http://localhost:8080` | Spring Boot 3 outbox & idempotency (`/actuator/health`) |
| **Ledger Service** | `bank_ledger_service` | `http://localhost:8081` | Spring Boot 3 double-entry engine (`/actuator/health`) |
| **Recon Service** | `bank_recon_service` | `http://localhost:8082` | Spring Boot 3 3-way reconciliation (`/actuator/health`) |
| **PostgreSQL 16** | `bank_postgres` | `localhost:5432` | Multi-DB (`payment_db`, `ledger_db`, `recon_db`) |
| **Apache Kafka** | `bank_kafka` | `localhost:9092` | KRaft single-node broker (`payment.events`) |
| **Redis 7** | `bank_redis` | `localhost:6379` | Distributed locks & SHA-256 idempotency cache |
| **Prometheus** | `bank_prometheus` | `http://localhost:9090` | Micrometer metrics scraping |
| **Grafana** | `bank_grafana` | `http://localhost:3001` | Dashboards (`admin` / `admin`) |

### Management & Operations Commands

```bash
# View live container status and healthcheck results
./deploy-docker.sh status
# or: make status

# Tail real-time unified logs across all services
./deploy-docker.sh logs
# or: make logs

# Tail logs for a specific microservice
./deploy-docker.sh logs payment-api
./deploy-docker.sh logs ledger-service

# Run automated smoke test connectivity checks
./deploy-docker.sh smoke-test

# Gracefully stop all containers
./deploy-docker.sh stop
# or: make down

# Tear down containers and wipe persistent database volumes
./deploy-docker.sh clean
# or: make clean
```

### Production Microservice Container Specifications

- **Multi-Stage Builds**: Java services build inside `maven:3.9.6-eclipse-temurin-21-alpine` and run inside lean `eclipse-temurin:21-jre-alpine` (~180MB footprint).
- **Hardened Security**: Unprivileged runtime user (`appuser:appgroup`), read-only root filesystems where applicable, and zero unnecessary OS packages.
- **Tuned JVM Ergonomics**: Pre-configured with container-aware cgroup memory ergonomics: `-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0`.
- **High-Performance Nginx Frontend**: Gzip compression for static assets, security headers (`X-Frame-Options`, `X-Content-Type-Options`), client-side SPA routing fallback, and internal reverse proxying for seamless CORS-free API communication.

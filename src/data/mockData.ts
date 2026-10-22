import {
  AccountRecord,
  PaymentRecord,
  OutboxRecord,
  KafkaMessage,
  JournalEntryRecord,
  ReconRunRecord,
  ReconBreakRecord,
  AuditLogRecord,
  FailureScenario,
  DisputeRecord,
  BatchPaymentRecord,
  FxSettlementRecord,
  ReconRuleRecord,
  SplitSettlementRecord,
  RefundRecord,
  ThreeWayReconItem,
  TreasurySweepRecord,
} from '../types';

export const initialAccounts: AccountRecord[] = [
  {
    id: 'acc_cust_101',
    name: 'Customer John Doe (Deposit)',
    type: 'LIABILITY',
    currency: 'USD',
    balance: 5000.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_merch_202',
    name: 'Acme Retailer (Operating)',
    type: 'LIABILITY',
    currency: 'USD',
    balance: 14200.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_merch_berlin_eur',
    name: 'Euro Retailer GmbH (Operating EUR)',
    type: 'LIABILITY',
    currency: 'EUR',
    balance: 8500.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_cash_clearing_usd',
    name: 'Federal Reserve / Clearing Asset',
    type: 'ASSET',
    currency: 'USD',
    balance: 1250000.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_fx_clearing',
    name: 'Foreign Exchange Clearing Pool',
    type: 'ASSET',
    currency: 'USD',
    balance: 350000.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_dispute_reserve',
    name: 'Card Network Dispute Escrow',
    type: 'LIABILITY',
    currency: 'USD',
    balance: 15000.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_clearing_fee_expense',
    name: 'Interchange & Network Fee Expense',
    type: 'EXPENSE',
    currency: 'USD',
    balance: 3410.50,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_platform_fee_revenue',
    name: 'Platform Take-Rate Revenue',
    type: 'REVENUE',
    currency: 'USD',
    balance: 4250.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_merchant_rolling_reserve',
    name: 'Merchant Rolling Reserve Escrow',
    type: 'LIABILITY',
    currency: 'USD',
    balance: 12000.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_treasury_overnight_mm',
    name: 'Overnight Money Market Liquidity Pool',
    type: 'ASSET',
    currency: 'USD',
    balance: 450000.00,
    version: 1,
    status: 'ACTIVE',
  },
  {
    id: 'acc_fx_spread_revenue',
    name: 'Treasury FX Spread Revenue',
    type: 'REVENUE',
    currency: 'USD',
    balance: 1845.20,
    version: 1,
    status: 'ACTIVE',
  },
];

export const initialPayments: PaymentRecord[] = [
  {
    id: 'pmt_9918274019283741',
    idempotencyKey: 'idem-uuid-98124-alpha',
    sourceAccountId: 'acc_cust_101',
    destinationAccountId: 'acc_merch_202',
    amount: 149.50,
    currency: 'USD',
    paymentMethod: 'CREDIT_CARD',
    reference: 'INV-2026-001',
    status: 'SETTLED',
    createdAt: '2026-10-17T04:15:00Z',
    updatedAt: '2026-10-17T04:15:02Z',
  },
  {
    id: 'pmt_3381928471920194',
    idempotencyKey: 'idem-uuid-55102-beta',
    sourceAccountId: 'acc_cust_101',
    destinationAccountId: 'acc_merch_202',
    amount: 82.00,
    currency: 'USD',
    paymentMethod: 'ACH_TRANSFER',
    reference: 'INV-2026-002',
    status: 'SETTLED',
    createdAt: '2026-10-17T04:30:12Z',
    updatedAt: '2026-10-17T04:30:14Z',
  },
];

export const initialOutbox: OutboxRecord[] = [
  {
    id: 'obx_1001827491',
    aggregateId: 'pmt_9918274019283741',
    eventType: 'PaymentInitiatedEvent',
    payload: JSON.stringify({
      paymentId: 'pmt_9918274019283741',
      amount: 149.50,
      currency: 'USD',
      sourceAccountId: 'acc_cust_101',
      destinationAccountId: 'acc_merch_202',
    }),
    traceParent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    status: 'PUBLISHED',
    retryCount: 0,
    createdAt: '2026-10-17T04:15:00Z',
    publishedAt: '2026-10-17T04:15:01Z',
  },
  {
    id: 'obx_1001827492',
    aggregateId: 'pmt_3381928471920194',
    eventType: 'PaymentInitiatedEvent',
    payload: JSON.stringify({
      paymentId: 'pmt_3381928471920194',
      amount: 82.00,
      currency: 'USD',
      sourceAccountId: 'acc_cust_101',
      destinationAccountId: 'acc_merch_202',
    }),
    traceParent: '00-7c2a1e9481b94df5a9ce929d0e0e4736-11f067aa0ba902b8-01',
    status: 'PUBLISHED',
    retryCount: 0,
    createdAt: '2026-10-17T04:30:12Z',
    publishedAt: '2026-10-17T04:30:13Z',
  },
];

export const initialKafkaMessages: KafkaMessage[] = [
  {
    offset: 104,
    partition: 1,
    topic: 'payment.events',
    key: 'pmt_9918274019283741',
    payload: '{"eventId":"evt_88192","paymentId":"pmt_9918274019283741","amount":149.50,"currency":"USD"}',
    traceParent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    timestamp: '2026-10-17T04:15:01Z',
  },
  {
    offset: 105,
    partition: 1,
    topic: 'payment.events',
    key: 'pmt_3381928471920194',
    payload: '{"eventId":"evt_88193","paymentId":"pmt_3381928471920194","amount":82.00,"currency":"USD"}',
    traceParent: '00-7c2a1e9481b94df5a9ce929d0e0e4736-11f067aa0ba902b8-01',
    timestamp: '2026-10-17T04:30:13Z',
  },
];

export const initialJournalEntries: JournalEntryRecord[] = [
  {
    id: 'jrn_771829031',
    paymentId: 'pmt_9918274019283741',
    eventId: 'evt_88192',
    description: 'Payment settlement for INV-2026-001',
    status: 'POSTED',
    createdAt: '2026-10-17T04:15:02Z',
    lines: [
      {
        id: 'line_001',
        accountId: 'acc_cust_101',
        entryType: 'DEBIT',
        amount: 149.50,
        currency: 'USD',
        createdAt: '2026-10-17T04:15:02Z',
      },
      {
        id: 'line_002',
        accountId: 'acc_merch_202',
        entryType: 'CREDIT',
        amount: 149.50,
        currency: 'USD',
        createdAt: '2026-10-17T04:15:02Z',
      },
    ],
  },
  {
    id: 'jrn_771829032',
    paymentId: 'pmt_3381928471920194',
    eventId: 'evt_88193',
    description: 'Payment settlement for INV-2026-002',
    status: 'POSTED',
    createdAt: '2026-10-17T04:30:14Z',
    lines: [
      {
        id: 'line_003',
        accountId: 'acc_cust_101',
        entryType: 'DEBIT',
        amount: 82.00,
        currency: 'USD',
        createdAt: '2026-10-17T04:30:14Z',
      },
      {
        id: 'line_004',
        accountId: 'acc_merch_202',
        entryType: 'CREDIT',
        amount: 82.00,
        currency: 'USD',
        createdAt: '2026-10-17T04:30:14Z',
      },
    ],
  },
];

export const initialReconRuns: ReconRunRecord[] = [
  {
    id: 'rcn_990182741',
    statementBatchId: 'STMT_2026_10_17_SETTL_01',
    statementFileName: 'bank_clearing_chase_20261017.csv',
    status: 'COMPLETED',
    totalRecords: 48,
    matchedRecords: 45,
    breaksCount: 3,
    currency: 'USD',
    executedAt: '2026-10-17T05:00:00Z',
    completedAt: '2026-10-17T05:00:02Z',
  },
];

export const initialBreaks: ReconBreakRecord[] = [
  {
    id: 'brk_00192847',
    reconRunId: 'rcn_990182741',
    breakType: 'AMOUNT_MISMATCH',
    status: 'UNRESOLVED',
    externalReference: 'EXT_TX_882910',
    statementAmount: 250.00,
    ledgerAmount: 240.00,
    varianceAmount: 10.00,
    currency: 'USD',
    detectedAt: '2026-10-17T05:00:02Z',
  },
  {
    id: 'brk_00192848',
    reconRunId: 'rcn_990182741',
    breakType: 'MISSING_IN_LEDGER',
    status: 'UNRESOLVED',
    externalReference: 'EXT_TX_990182',
    statementAmount: 350.00,
    ledgerAmount: undefined,
    varianceAmount: 350.00,
    currency: 'USD',
    detectedAt: '2026-10-17T05:00:02Z',
  },
  {
    id: 'brk_00192849',
    reconRunId: 'rcn_990182741',
    breakType: 'DUPLICATE_STATEMENT',
    status: 'RESOLVED',
    externalReference: 'EXT_TX_771822',
    statementAmount: 89.95,
    ledgerAmount: 89.95,
    varianceAmount: 0.00,
    currency: 'USD',
    detectedAt: '2026-10-17T05:00:02Z',
    resolvedAt: '2026-10-17T05:20:00Z',
  },
];

export const initialAuditLogs: AuditLogRecord[] = [
  {
    id: 'adt_551029481',
    breakId: 'brk_00192849',
    actionType: 'DISCARD_DUPLICATE_FEED',
    operatorUsername: 'sarah_chen_lead_auditor',
    justification: 'External banking partner confirmed batch file retry sent twice in error. Reversal not required as internal ledger was posted once.',
    adjustingLedgerAccount: undefined,
    createdAt: '2026-10-17T05:20:00Z',
  },
];

export const initialDisputes: DisputeRecord[] = [
  {
    id: 'dsp_88192031',
    paymentId: 'pmt_9918274019283741',
    amount: 149.50,
    currency: 'USD',
    reason: 'FRAUD_UNAUTHORIZED_CARD_USE',
    status: 'OPEN_UNDER_REVIEW',
    disputeFee: 15.00,
    merchantAccountId: 'acc_merch_202',
    evidenceNotes: 'Cardholder filed chargeback via Visa Claims Resolution (VCR). Merchant notified to provide delivery proof.',
    createdAt: '2026-10-17T06:10:00Z',
    journalEntryId: 'jrn_dsp_hold_01',
  },
];

export const initialBatches: BatchPaymentRecord[] = [
  {
    batchId: 'BATCH_20261017_PAYOUT_01',
    batchIdempotencyKey: 'batch-idem-fri-payout-01',
    totalItems: 4,
    totalAmount: 1850.00,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2026-10-17T06:00:00Z',
    settledAt: '2026-10-17T06:00:02Z',
    items: [
      {
        id: 'pmt_b1_01',
        idempotencyKey: 'idem-b1-01',
        sourceAccountId: 'acc_cash_clearing_usd',
        destinationAccountId: 'acc_merch_202',
        amount: 650.00,
        currency: 'USD',
        paymentMethod: 'ACH_PAYOUT',
        reference: 'PAYOUT-ACME-01',
        status: 'SETTLED',
        createdAt: '2026-10-17T06:00:00Z',
        updatedAt: '2026-10-17T06:00:02Z',
      },
      {
        id: 'pmt_b1_02',
        idempotencyKey: 'idem-b1-02',
        sourceAccountId: 'acc_cash_clearing_usd',
        destinationAccountId: 'acc_merch_202',
        amount: 420.00,
        currency: 'USD',
        paymentMethod: 'ACH_PAYOUT',
        reference: 'PAYOUT-ACME-02',
        status: 'SETTLED',
        createdAt: '2026-10-17T06:00:00Z',
        updatedAt: '2026-10-17T06:00:02Z',
      },
      {
        id: 'pmt_b1_03',
        idempotencyKey: 'idem-b1-03',
        sourceAccountId: 'acc_cash_clearing_usd',
        destinationAccountId: 'acc_merch_202',
        amount: 530.00,
        currency: 'USD',
        paymentMethod: 'ACH_PAYOUT',
        reference: 'PAYOUT-ACME-03',
        status: 'SETTLED',
        createdAt: '2026-10-17T06:00:00Z',
        updatedAt: '2026-10-17T06:00:02Z',
      },
      {
        id: 'pmt_b1_04',
        idempotencyKey: 'idem-b1-04',
        sourceAccountId: 'acc_cash_clearing_usd',
        destinationAccountId: 'acc_merch_202',
        amount: 250.00,
        currency: 'USD',
        paymentMethod: 'ACH_PAYOUT',
        reference: 'PAYOUT-ACME-04',
        status: 'SETTLED',
        createdAt: '2026-10-17T06:00:00Z',
        updatedAt: '2026-10-17T06:00:02Z',
      },
    ],
  },
];

export const initialFxSettlements: FxSettlementRecord[] = [
  {
    id: 'fx_771829031',
    sourceAccountId: 'acc_cust_101',
    destinationAccountId: 'acc_merch_berlin_eur',
    sourceAmount: 132.30,
    sourceCurrency: 'USD',
    targetAmount: 120.00,
    targetCurrency: 'EUR',
    exchangeRate: 1.09,
    spreadFee: 1.50,
    status: 'SETTLED',
    reference: 'FX-ORD-BERLIN-991',
    createdAt: '2026-10-17T05:40:00Z',
    journalEntryId: 'jrn_fx_berlin_01',
  },
];

export const initialReconRules: ReconRuleRecord[] = [
  {
    id: 'rule_interchange_tol',
    name: 'Interchange Fee Rounding Tolerance',
    amountTolerance: 0.05,
    timeToleranceHours: 24,
    autoResolveThreshold: 1.00,
    enabled: true,
  },
  {
    id: 'rule_holiday_float',
    name: 'Banking Holiday Clearing Window',
    amountTolerance: 0.00,
    timeToleranceHours: 72,
    autoResolveThreshold: 0.00,
    enabled: true,
  },
];

export const initialSplitSettlements: SplitSettlementRecord[] = [
  {
    id: 'splt_10928374',
    paymentId: 'pmt_split_marketplace_01',
    idempotencyKey: 'idem-split-alpha-99',
    grossAmount: 150.00,
    interchangeFee: 3.45,
    platformFee: 7.50,
    rollingReserveHold: 7.50,
    merchantNetPayout: 131.55,
    currency: 'USD',
    merchantAccountId: 'acc_merch_202',
    customerAccountId: 'acc_cust_101',
    status: 'SETTLED',
    reference: 'ORD-MARKETPLACE-1092',
    createdAt: '2026-10-17T05:10:00Z',
    journalEntryId: 'jrn_split_demo_01',
  },
];

export const initialRefunds: RefundRecord[] = [
  {
    id: 'ref_88291039',
    originalPaymentId: 'pmt_9918274019283741',
    originalAmount: 149.50,
    refundAmount: 45.00,
    proRataInterchangeRefund: 0.95,
    proRataPlatformFeeRefund: 2.25,
    remainingRefundable: 104.50,
    currency: 'USD',
    reason: 'CUSTOMER_RETURN_PARTIAL_ITEM',
    status: 'COMPLETED',
    createdAt: '2026-10-17T06:12:00Z',
    journalEntryId: 'jrn_ref_partial_01',
  },
];

export const initialThreeWayReconItems: ThreeWayReconItem[] = [
  {
    id: '3way_001',
    transactionReference: 'TX-GATEWAY-8812',
    gatewayAmount: 120.00,
    gatewayStatus: 'CAPTURED',
    ledgerAmount: 120.00,
    ledgerStatus: 'POSTED',
    bankAmount: 120.00,
    bankStatus: 'CLEARED',
    matchStatus: 'PERFECT_MATCH',
    varianceAmount: 0.00,
    resolved: true,
    resolvedAt: '2026-10-17T06:30:00Z',
  },
  {
    id: '3way_002',
    transactionReference: 'TX-CHASE-WIRE-FEE-449',
    gatewayAmount: 0.00,
    gatewayStatus: 'FAILED',
    ledgerAmount: null,
    ledgerStatus: 'NOT_POSTED',
    bankAmount: 15.00,
    bankStatus: 'CLEARED',
    matchStatus: 'UNPOSTED_BANK_FEE',
    varianceAmount: 15.00,
    remediationAction: 'Auto-post adjusting ledger entry to acc_clearing_fee_expense (Credit Federal Reserve Asset $15.00, Debit Clearing Fee Expense $15.00)',
    resolved: false,
  },
  {
    id: '3way_003',
    transactionReference: 'TX-GATEWAY-DROP-9014',
    gatewayAmount: 210.00,
    gatewayStatus: 'CAPTURED',
    ledgerAmount: 210.00,
    ledgerStatus: 'POSTED',
    bankAmount: null,
    bankStatus: 'MISSING',
    matchStatus: 'GATEWAY_DROP',
    varianceAmount: 210.00,
    remediationAction: 'Bank CAMT.053 missing settlement: investigate processor capture webhook timeout or reverse provisional ledger entry',
    resolved: false,
  },
  {
    id: '3way_004',
    transactionReference: 'TX-ACH-INFLIGHT-7721',
    gatewayAmount: 350.00,
    gatewayStatus: 'CAPTURED',
    ledgerAmount: 350.00,
    ledgerStatus: 'POSTED',
    bankAmount: null,
    bankStatus: 'MISSING',
    matchStatus: 'IN_FLIGHT_ACH',
    varianceAmount: 350.00,
    remediationAction: 'Standard ACH settlement window T+2: flag as clearing float, no corrective journal entry required',
    resolved: false,
  },
];

export const initialTreasurySweeps: TreasurySweepRecord[] = [
  {
    id: 'swp_5510293',
    sourceAccountId: 'acc_cash_clearing_usd',
    destinationAccountId: 'acc_treasury_overnight_mm',
    amount: 150000.00,
    currency: 'USD',
    sweepType: 'OVERNIGHT_MONEY_MARKET',
    reference: 'EOD-TREASURY-SWEEP-NY-01',
    status: 'EXECUTED',
    createdAt: '2026-10-17T06:45:00Z',
    journalEntryId: 'jrn_sweep_01',
  },
];


export const failureScenarios: FailureScenario[] = [
  {
    id: 'scenario_1',
    title: '1. API Crash After Database Commit',
    subtitle: 'Process killed right after PostgreSQL COMMIT; before Kafka send',
    tag: 'Transactional Outbox',
    severity: 'CRITICAL',
    description: 'The payment API successfully commits the payment to PostgreSQL, but the JVM container is forcefully terminated (e.g. OOMKilled, spot instance termination) before emitting to Kafka.',
    rootCause: 'In naive architectures using Dual-Write (writing to DB then calling KafkaTemplate), a crash in between loses the Kafka event forever. The customer is charged, but ledger and downstream systems never know.',
    mitigation: 'Transactional Outbox Pattern. The Payment entity AND the Outbox record are committed together in one atomic ACID database transaction. When the new container instance boots, the OutboxRelayScheduler reads all PENDING rows and publishes to Kafka. Zero data loss.',
    architecturalInsights: [
      'Dual-Write is an anti-pattern because 2PC (Two-Phase Commit / XA) is slow, fragile, and not supported by Kafka natively.',
      'Outbox table acts as a reliable durable buffer on disk within Postgres.',
      'Outbox Relay uses pessimistic polling or Debezium CDC (Change Data Capture) reading Postgres WAL (Write-Ahead Log) for minimal latency.'
    ],
    javaTestSnippet: `@Test
void testOutboxSurvivesApiCrash() {
    // 1. Process payment inside transactional service
    PaymentResponse res = paymentService.processPaymentWithIdempotency("key-1", request);
    
    // 2. Simulate API process crash (Kafka template was never invoked)
    // Verify outbox row is safely committed to PostgreSQL
    List<PaymentOutbox> outbox = outboxRepo.findPendingRecords(PageRequest.of(0, 10));
    assertThat(outbox).hasSize(1);
    assertThat(outbox.get(0).getStatus()).isEqualTo("PENDING");
    
    // 3. New relay instance starts up and drains pending backlog
    relayScheduler.drainOutbox();
    assertThat(outboxRepo.findById(outbox.get(0).getId()).get().getStatus()).isEqualTo("PUBLISHED");
}`
  },
  {
    id: 'scenario_2',
    title: '2. Kafka Unavailable (Outbox Accumulates, Then Drains)',
    subtitle: 'Kafka cluster network partition or leader reelection outage',
    tag: 'Broker Outage Resilience',
    severity: 'CRITICAL',
    description: 'Apache Kafka becomes temporarily unreachable due to network partition or broker crash. Client payments continue to be accepted with 201 Created.',
    rootCause: 'If payment ingestion had synchronous hard dependency on Kafka availability, payment acceptance would halt entirely, crashing business revenue.',
    mitigation: 'Decoupled asynchronous durability. The HTTP API saves payments + outbox rows into PostgreSQL normally. OutboxRelayScheduler catches KafkaException, increments retry count with exponential backoff, and leaves records in PENDING status. When Kafka recovers, the relay drains the accumulated backlog without loss.',
    architecturalInsights: [
      'Decouples synchronous payment ingestion from asynchronous ledger propagation.',
      'PostgreSQL handles the write burst; Kafka recovers at its own pace.',
      'Monitored via Micrometer gauge: payment_outbox_pending_count.'
    ],
    javaTestSnippet: `@Test
void testKafkaOutageAndBacklogDrain() {
    // 1. Stop Kafka container or mock KafkaException
    doThrow(new KafkaException("Connection refused")).when(kafkaTemplate).send(any());
    
    // 2. Accept 10 incoming payments
    for (int i = 0; i < 10; i++) {
        paymentService.processPaymentWithIdempotency("key-" + i, request);
    }
    assertThat(outboxRepo.findPendingRecords(Pageable.unpaged())).hasSize(10);
    
    // 3. Kafka recovers; mock normal send
    reset(kafkaTemplate);
    relayScheduler.drainOutbox();
    assertThat(outboxRepo.findPendingRecords(Pageable.unpaged())).isEmpty();
}`
  },
  {
    id: 'scenario_3',
    title: '3. Duplicate Delivery (At-Least-Once Semantics)',
    subtitle: 'Kafka rebalance or network glitch causes consumer to re-read same message',
    tag: 'Idempotent Consumer',
    severity: 'HIGH',
    description: 'Kafka rebalances or a consumer commit timeout forces message re-delivery. Ledger service receives the identical event twice.',
    rootCause: 'Kafka provides at-least-once message delivery by default. Without consumer idempotency, ledger lines would be posted twice, doubling customer debits.',
    mitigation: 'The ledger service maintains a consumed_events(event_id) table. In the same database transaction as the double-entry posting, it inserts the event_id. On the duplicate delivery, the check detects the existing event or triggers a unique constraint violation, cleanly acknowledging without double-posting.',
    architecturalInsights: [
      'Exactly-once delivery in distributed messaging is an end-to-end property, achieved via at-least-once transport + idempotent receiver.',
      'The consumer offset commit and ledger write cannot be 2PC, so the consumed_events table acts as the transactional deduplication barrier.'
    ],
    javaTestSnippet: `@Test
void testDuplicateDeliveryIsSafelyIgnored() {
    PaymentInitiatedEvent event = createSampleEvent("evt_dup_99");
    
    // First delivery: processes successfully and posts journal
    boolean firstResult = ledgerService.processPaymentEvent(event);
    assertThat(firstResult).isTrue();
    
    // Second delivery (duplicate from Kafka rebalance)
    boolean secondResult = ledgerService.processPaymentEvent(event);
    assertThat(secondResult).isFalse();
    
    // Invariant: Journal entries count for this payment must remain EXACTLY 1
    assertThat(journalRepo.findByPaymentId(event.paymentId())).isPresent();
    assertThat(ledgerLineRepo.findAll()).hasSize(2); // Only 1 debit + 1 credit
}`
  },
  {
    id: 'scenario_4',
    title: '4. Concurrent Debits on Single Account',
    subtitle: 'Two simultaneous payments attempt to debit the same account at the exact same millisecond',
    tag: 'Concurrency & Locking',
    severity: 'HIGH',
    description: 'Customer account has $100 balance. Two checkout transactions of $80 arrive at the exact same instant across two parallel consumer threads.',
    rootCause: 'Race condition: Thread A reads $100, Thread B reads $100. Both approve, leading to balance of -$60 (illegal overdraft).',
    mitigation: 'Account repository executes SELECT ... FOR UPDATE (Pessimistic Write Lock) on the account row in PostgreSQL. Thread A acquires the row lock, executes debit, updates balance to $20, commits and releases lock. Thread B then acquires lock, sees $20, detects insufficient funds, and rejects cleanly.',
    architecturalInsights: [
      'Pessimistic lock (SELECT FOR UPDATE) vs Optimistic lock (@Version): For hot accounts with high write contention, optimistic locking causes excessive retry storms and rollbacks. Pessimistic locking provides deterministic FIFO queueing at the database level.',
      'Deadlock prevention: Always sort account lock acquisition order (e.g. by account UUID) if a single transaction locks multiple accounts.'
    ],
    javaTestSnippet: `@Test
void testConcurrentDebitsPessimisticLock() throws Exception {
    Account acc = accountRepo.save(new Account("acc_target", "Cust", "LIABILITY", "USD", new BigDecimal("100.00")));
    
    ExecutorService executor = Executors.newFixedThreadPool(2);
    Callable<Boolean> task = () -> ledgerService.processPaymentEvent(createDebitEvent(acc.getId(), new BigDecimal("80.00")));
    
    Future<Boolean> f1 = executor.submit(task);
    Future<Boolean> f2 = executor.submit(task);
    
    // One must succeed, and one must fail/reject due to balance check
    assertThat(acc.getBalance()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
}`
  },
  {
    id: 'scenario_5',
    title: '5. Poison Message to Dead-Letter Topic (DLT)',
    subtitle: 'Corrupt JSON or unparseable event received on Kafka topic',
    tag: 'Dead-Letter Queue',
    severity: 'HIGH',
    description: 'A third-party producer sends malformed JSON or an event missing mandatory fields into payment.events topic.',
    rootCause: 'If an unhandled deserialization error occurs, the Kafka consumer thread crashes and restarts, re-reading the same poison message in an infinite retry loop, blocking the entire partition.',
    mitigation: 'Spring Kafka @RetryableTopic with DeadLetterPublishingRecoverer. Configured with 3 retry attempts and exponential backoff (1s, 2s, 4s). If deserialization fails or business exception persists, the message is routed to payment.events.DLT with original headers and error stack trace, allowing the partition to continue processing.',
    architecturalInsights: [
      'Never allow a single poison pill to stall partition consumption (head-of-line blocking).',
      'The DLT topic has alerting attached, allowing engineering to replay via a recovery CLI once fixed.'
    ],
    javaTestSnippet: `@Test
void testPoisonPillRoutesToDlt() {
    // Send invalid payload to Kafka
    kafkaTemplate.send("payment.events", "invalid_key", "{malformed-json-here}");
    
    // Await message in Dead Letter Topic
    ConsumerRecord<String, String> dltRecord = KafkaTestUtils.getSingleRecord(dltConsumer, "payment.events.DLT", Duration.ofSeconds(5));
    assertThat(dltRecord).isNotNull();
    assertThat(new String(dltRecord.headers().lastHeader(KafkaHeaders.EXCEPTION_MESSAGE).value()))
        .contains("JsonParseException");
}`
  },
  {
    id: 'scenario_6',
    title: '6. Out-of-Order Events',
    subtitle: 'Payment settlement arrives before payment authorization due to partition skew',
    tag: 'Event Sequencing',
    severity: 'MEDIUM',
    description: 'In asynchronous distributed messaging, network latency can cause a SettlementEvent to arrive at the consumer before the AuthorizationEvent.',
    rootCause: 'If authorization and settlement were published to different Kafka partitions with different keys, strict ordering is not guaranteed across partitions.',
    mitigation: 'Partition Keying by aggregateId (Payment ID) ensures all events for the same payment land on the exact same Kafka partition, which guarantees FIFO ordering. In the event of cross-system feeds, the ledger uses a state-machine or temporary Clearing Suspense Account until the predecessor event arrives.',
    architecturalInsights: [
      'Kafka only guarantees message order WITHIN a partition, never across partitions.',
      'Always use aggregateId (e.g. paymentId) as the Kafka record key to ensure single-partition sequential delivery.'
    ],
    javaTestSnippet: `@Test
void testKafkaPartitionKeyGuarantee() {
    String paymentId = "pmt_order_test_88";
    ProducerRecord<String, String> rec1 = new ProducerRecord<>("payment.events", paymentId, authPayload);
    ProducerRecord<String, String> rec2 = new ProducerRecord<>("payment.events", paymentId, settlePayload);
    
    // Both records must map to the EXACT same partition
    int p1 = kafkaProducer.partitionsFor("payment.events").get(0).partition();
    assertThat(rec1.key()).isEqualTo(rec2.key());
}`
  },
  {
    id: 'scenario_7',
    title: '7. Consumer Crash Mid-Batch',
    subtitle: 'JVM killed while processing record 4 of a 10-message poll batch',
    tag: 'Batch Crash Recovery',
    severity: 'CRITICAL',
    description: 'The Kafka consumer polls a batch of 10 messages. Records 1, 2, and 3 are successfully processed into Postgres. The server crashes while processing record 4, before committing Kafka offsets.',
    rootCause: 'Since offsets were not yet committed to Kafka, on recovery the consumer will re-poll all 10 messages from offset 0.',
    mitigation: 'Combination of RECORD ack-mode or transactional deduplication: Because records 1, 2, and 3 committed their event IDs into the consumed_events table in their respective DB transactions, on redelivery the consumer checks the table and skips items 1-3 with zero duplicate side effects, safely resuming processing at item 4.',
    architecturalInsights: [
      'Enabling AckMode.RECORD vs AckMode.BATCH: RECORD commits offset after each record, reducing replay scope. Dedupe table guarantees idempotency regardless.',
      'Spring Kafka ContainerProperties.AckMode.RECORD configuration.'
    ],
    javaTestSnippet: `@Test
void testConsumerCrashMidBatchRecovery() {
    List<PaymentInitiatedEvent> batch = generateEvents(10);
    // Process items 0..2
    for (int i = 0; i < 3; i++) {
        ledgerService.processPaymentEvent(batch.get(i));
    }
    // Simulate crash before offset commit: re-read entire batch of 10
    int newlyProcessed = 0;
    for (PaymentInitiatedEvent e : batch) {
        if (ledgerService.processPaymentEvent(e)) {
            newlyProcessed++;
        }
    }
    // Only remaining 7 items must be posted
    assertThat(newlyProcessed).isEqualTo(7);
}`
  }
];

export const systemCapabilities = [
  {
    category: 'Distributed Transactions',
    title: 'Zero Data Loss via Transactional Outbox Pattern',
    description: 'Eliminates dual-write vulnerabilities where an API commits to Postgres but crashes before publishing to Kafka. Both the business record and outbox message persist atomically inside a single ACID database transaction.'
  },
  {
    category: 'Financial Invariants',
    title: 'Immutable Double-Entry Bookkeeping',
    description: 'Guarantees the mathematical accounting invariant where sum(Debits) strictly equals sum(Credits). The ledger operates on WORM (Write Once, Read Many) principles with zero in-place mutations; adjustments are recorded via counter-balancing reversing entries.'
  },
  {
    category: 'Idempotency',
    title: 'Deterministic SHA-256 Payload Fingerprinting',
    description: 'Enforces RFC-style Idempotency-Key handling. Identical payloads return cached responses instantly without side-effects, while replaying the same key with conflicting payloads returns HTTP 409 Conflict.'
  },
  {
    category: 'Concurrency Control',
    title: 'Pessimistic Row Locking for Overdraft Prevention',
    description: 'PostgreSQL row locks (SELECT ... FOR UPDATE) prevent simultaneous debit race conditions on high-frequency accounts, maintaining deterministic balance validation without rollback storms.'
  },
  {
    category: 'Reconciliation',
    title: 'Automated Multi-Source Statement Matching',
    description: 'Reconciles external bank statement feeds against internal ledger entries, isolates discrepancies into structured break categories, and records manual resolutions into an immutable append-only audit trail.'
  },
  {
    category: 'Observability',
    title: 'End-to-End W3C Distributed Tracing',
    description: 'Context propagation using OpenTelemetry and Micrometer seamlessly binds traceparent headers across HTTP requests, database transactions, Kafka record headers, and SLF4J MDC logging.'
  }
];

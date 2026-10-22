export interface PaymentRecord {
  id: string;
  idempotencyKey: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  status: 'PENDING' | 'ACCEPTED' | 'SETTLED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  disputeId?: string;
}

export interface OutboxRecord {
  id: string;
  aggregateId: string;
  eventType: string;
  payload: string;
  traceParent: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  createdAt: string;
  publishedAt?: string;
}

export interface KafkaMessage {
  offset: number;
  partition: number;
  topic: string;
  key: string;
  payload: string;
  traceParent: string;
  timestamp: string;
}

export interface AccountRecord {
  id: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency: string;
  balance: number;
  version: number;
  status?: 'ACTIVE' | 'FROZEN_AML' | 'FROZEN_COMPLIANCE';
  freezeReason?: string;
}

export interface LedgerLineRecord {
  id: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  createdAt: string;
}

export interface JournalEntryRecord {
  id: string;
  paymentId: string;
  eventId: string;
  description: string;
  status: 'POSTED' | 'REVERSED';
  reversalOfId?: string;
  createdAt: string;
  lines: LedgerLineRecord[];
}

export interface ReconRunRecord {
  id: string;
  statementBatchId: string;
  statementFileName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalRecords: number;
  matchedRecords: number;
  breaksCount: number;
  currency: string;
  executedAt: string;
  completedAt?: string;
}

export interface ReconBreakRecord {
  id: string;
  reconRunId: string;
  breakType: 'MISSING_IN_LEDGER' | 'AMOUNT_MISMATCH' | 'DUPLICATE_STATEMENT';
  status: 'UNRESOLVED' | 'RESOLVED';
  externalReference: string;
  statementAmount: number;
  ledgerAmount?: number;
  varianceAmount: number;
  currency: string;
  detectedAt: string;
  resolvedAt?: string;
}

export interface AuditLogRecord {
  id: string;
  breakId: string;
  actionType: string;
  operatorUsername: string;
  justification: string;
  adjustingLedgerAccount?: string;
  createdAt: string;
}

export interface FailureScenario {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  rootCause: string;
  mitigation: string;
  architecturalInsights: string[];
  javaTestSnippet: string;
}

// --- Enhanced Real-World Enterprise Models ---

export interface BatchPaymentItem {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  reference: string;
  beneficiaryName: string;
}

export interface BatchPaymentRecord {
  batchId: string;
  batchIdempotencyKey: string;
  totalItems: number;
  totalAmount: number;
  currency: string;
  status: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  items: PaymentRecord[];
  createdAt: string;
  settledAt?: string;
}

export interface DisputeRecord {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'OPEN_UNDER_REVIEW' | 'RESOLVED_MERCHANT_WON' | 'RESOLVED_REFUNDED';
  disputeFee: number;
  merchantAccountId: string;
  evidenceNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  journalEntryId?: string;
}

export interface FxSettlementRecord {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  spreadFee: number;
  status: 'SETTLED' | 'PENDING';
  reference: string;
  createdAt: string;
  journalEntryId: string;
}

export interface TrialBalanceItem {
  accountId: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency: string;
  debitBalance: number;
  creditBalance: number;
}

export interface AccountStatementItem {
  id: string;
  timestamp: string;
  journalEntryId: string;
  reference: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  runningBalance: number;
  description: string;
}

export interface ReconRuleRecord {
  id: string;
  name: string;
  amountTolerance: number;
  timeToleranceHours: number;
  autoResolveThreshold: number;
  enabled: boolean;
}

export interface SplitSettlementRecord {
  id: string;
  paymentId: string;
  idempotencyKey: string;
  grossAmount: number;
  interchangeFee: number;
  platformFee: number;
  merchantNetPayout: number;
  rollingReserveHold: number;
  currency: string;
  merchantAccountId: string;
  customerAccountId: string;
  status: 'SETTLED' | 'PENDING';
  reference: string;
  createdAt: string;
  journalEntryId: string;
}

export interface RefundRecord {
  id: string;
  originalPaymentId: string;
  originalAmount: number;
  refundAmount: number;
  proRataInterchangeRefund: number;
  proRataPlatformFeeRefund: number;
  remainingRefundable: number;
  currency: string;
  reason: string;
  status: 'COMPLETED' | 'FAILED';
  createdAt: string;
  journalEntryId: string;
}

export interface ThreeWayReconItem {
  id: string;
  transactionReference: string;
  gatewayAmount: number;
  gatewayStatus: 'CAPTURED' | 'FAILED' | 'PENDING';
  ledgerAmount: number | null;
  ledgerStatus: 'POSTED' | 'NOT_POSTED';
  bankAmount: number | null;
  bankStatus: 'CLEARED' | 'MISSING';
  matchStatus: 'PERFECT_MATCH' | 'UNPOSTED_BANK_FEE' | 'GATEWAY_DROP' | 'IN_FLIGHT_ACH';
  varianceAmount: number;
  remediationAction?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface TreasurySweepRecord {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  sweepType: 'OVERNIGHT_MONEY_MARKET' | 'INTERCOMPANY_DUE_TO_FROM' | 'OPERATIONAL_MINIMUM_RESERVE';
  reference: string;
  status: 'EXECUTED';
  createdAt: string;
  journalEntryId: string;
}


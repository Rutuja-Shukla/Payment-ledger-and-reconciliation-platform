import React, { useState } from 'react';
import { Header } from './components/Header';
import { ArchitectureView } from './components/ArchitectureView';
import { RealWorldScenarios } from './components/RealWorldScenarios';
import { PaymentApiConsole } from './components/PaymentApiConsole';
import { LedgerConsole } from './components/LedgerConsole';
import { ReconConsole } from './components/ReconConsole';
import { FailureSimulator } from './components/FailureSimulator';
import { SystemCapabilities } from './components/SystemCapabilities';
import { CodeExplorer } from './components/CodeExplorer';
import {
  initialAccounts,
  initialPayments,
  initialOutbox,
  initialKafkaMessages,
  initialJournalEntries,
  initialReconRuns,
  initialBreaks,
  initialAuditLogs,
  initialBatches,
  initialDisputes,
  initialFxSettlements,
  initialReconRules,
  initialSplitSettlements,
  initialRefunds,
  initialThreeWayReconItems,
  initialTreasurySweeps,
} from './data/mockData';
import {
  PaymentRecord,
  OutboxRecord,
  KafkaMessage,
  AccountRecord,
  JournalEntryRecord,
  ReconRunRecord,
  ReconBreakRecord,
  AuditLogRecord,
  BatchPaymentRecord,
  DisputeRecord,
  FxSettlementRecord,
  ReconRuleRecord,
  SplitSettlementRecord,
  RefundRecord,
  ThreeWayReconItem,
  TreasurySweepRecord,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('operations');

  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [outbox, setOutbox] = useState<OutboxRecord[]>(initialOutbox);
  const [kafkaMessages, setKafkaMessages] = useState<KafkaMessage[]>(initialKafkaMessages);
  const [accounts, setAccounts] = useState<AccountRecord[]>(initialAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntryRecord[]>(initialJournalEntries);
  const [reconRuns, setReconRuns] = useState<ReconRunRecord[]>(initialReconRuns);
  const [breaks, setBreaks] = useState<ReconBreakRecord[]>(initialBreaks);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(initialAuditLogs);

  // New Enterprise Collections
  const [batches, setBatches] = useState<BatchPaymentRecord[]>(initialBatches);
  const [disputes, setDisputes] = useState<DisputeRecord[]>(initialDisputes);
  const [fxSettlements, setFxSettlements] = useState<FxSettlementRecord[]>(initialFxSettlements);
  const [reconRules, setReconRules] = useState<ReconRuleRecord[]>(initialReconRules);
  const [splitSettlements, setSplitSettlements] = useState<SplitSettlementRecord[]>(initialSplitSettlements);
  const [refunds, setRefunds] = useState<RefundRecord[]>(initialRefunds);
  const [threeWayReconItems, setThreeWayReconItems] = useState<ThreeWayReconItem[]>(initialThreeWayReconItems);
  const [treasurySweeps, setTreasurySweeps] = useState<TreasurySweepRecord[]>(initialTreasurySweeps);

  // Store for idempotency cache: key -> { amount, response }
  const [idempotencyStore, setIdempotencyStore] = useState<Map<string, { amount: number; response: any }>>(() => {
    const map = new Map();
    initialPayments.forEach((p) => {
      map.set(p.idempotencyKey, {
        amount: p.amount,
        response: {
          paymentId: p.id,
          status: p.status,
          sourceAccountId: p.sourceAccountId,
          destinationAccountId: p.destinationAccountId,
          amount: p.amount,
          currency: p.currency,
          idempotencyKey: p.idempotencyKey,
          reference: p.reference,
          createdAt: p.createdAt,
        },
      });
    });
    return map;
  });

  // Action: Ingest Payment (POST /v1/payments)
  const handleInitiatePayment = (request: {
    idempotencyKey: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    reference: string;
  }) => {
    // 1. Check idempotency registry
    const existing = idempotencyStore.get(request.idempotencyKey);
    if (existing) {
      if (Math.abs(existing.amount - request.amount) < 0.001) {
        // Cache HIT: Identical payload
        return {
          success: true,
          status: 200,
          body: existing.response,
        };
      } else {
        // Conflict (409): Same key with modified amount/payload
        return {
          success: false,
          status: 409,
          body: {
            error: 'Conflict',
            status: 409,
            message: `Idempotency key '${request.idempotencyKey}' was already used with a different request payload. Original amount: $${existing.amount.toFixed(2)}, Supplied amount: $${request.amount.toFixed(2)}`,
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // 2. New Transaction: Atomic DB write (Payment + Outbox record)
    const paymentId = 'pmt_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();

    const newPayment: PaymentRecord = {
      id: paymentId,
      idempotencyKey: request.idempotencyKey,
      sourceAccountId: request.sourceAccountId,
      destinationAccountId: request.destinationAccountId,
      amount: request.amount,
      currency: request.currency,
      paymentMethod: request.paymentMethod,
      reference: request.reference,
      status: 'ACCEPTED',
      createdAt: now,
      updatedAt: now,
    };

    const outboxId = 'obx_' + Math.random().toString(36).substring(2, 10);
    const traceParent = '00-' + Math.random().toString(16).substring(2, 34) + '-00f067aa0ba902b9-01';

    const newOutbox: OutboxRecord = {
      id: outboxId,
      aggregateId: paymentId,
      eventType: 'PaymentInitiatedEvent',
      payload: JSON.stringify({
        eventId: 'evt_' + Math.random().toString(36).substring(2, 10),
        paymentId,
        idempotencyKey: request.idempotencyKey,
        amount: request.amount,
        currency: request.currency,
        sourceAccountId: request.sourceAccountId,
        destinationAccountId: request.destinationAccountId,
      }),
      traceParent,
      status: 'PENDING',
      retryCount: 0,
      createdAt: now,
    };

    const responseBody = {
      paymentId,
      status: 'ACCEPTED',
      sourceAccountId: request.sourceAccountId,
      destinationAccountId: request.destinationAccountId,
      amount: request.amount,
      currency: request.currency,
      idempotencyKey: request.idempotencyKey,
      reference: request.reference,
      createdAt: now,
    };

    // Update state
    setPayments((prev) => [newPayment, ...prev]);
    setOutbox((prev) => [newOutbox, ...prev]);

    // Update idempotency cache
    setIdempotencyStore((prev) => {
      const next = new Map(prev);
      next.set(request.idempotencyKey, {
        amount: request.amount,
        response: responseBody,
      });
      return next;
    });

    return {
      success: true,
      status: 201,
      body: responseBody,
    };
  };

  // Action: Drain Outbox Relay (simulates background scheduler)
  const handleDrainOutbox = () => {
    const pending = outbox.filter((o) => o.status === 'PENDING');
    if (pending.length === 0) return;

    const now = new Date().toISOString();

    // 1. Mark outbox records PUBLISHED
    setOutbox((prev) =>
      prev.map((o) =>
        o.status === 'PENDING' ? { ...o, status: 'PUBLISHED', publishedAt: now } : o
      )
    );

    // 2. Publish to Kafka
    const newKafkaMessages: KafkaMessage[] = pending.map((record, idx) => ({
      offset: kafkaMessages.length + idx + 1,
      partition: 1,
      topic: 'payment.events',
      key: record.aggregateId,
      payload: record.payload,
      traceParent: record.traceParent,
      timestamp: now,
    }));
    setKafkaMessages((prev) => [...newKafkaMessages, ...prev]);

    // 3. Ledger Consumer: Consume events and post balanced double-entry lines
    pending.forEach((record) => {
      try {
        const payload = JSON.parse(record.payload);
        const journalId = 'jrn_' + Math.random().toString(36).substring(2, 11);

        const newJournalEntry: JournalEntryRecord = {
          id: journalId,
          paymentId: payload.paymentId,
          eventId: payload.eventId || 'evt_live',
          description: `Settlement for payment ${payload.paymentId}`,
          status: 'POSTED',
          createdAt: now,
          lines: [
            {
              id: 'line_' + Math.random().toString(36).substring(2, 10),
              accountId: payload.sourceAccountId,
              entryType: 'DEBIT',
              amount: payload.amount,
              currency: payload.currency,
              createdAt: now,
            },
            {
              id: 'line_' + Math.random().toString(36).substring(2, 10),
              accountId: payload.destinationAccountId,
              entryType: 'CREDIT',
              amount: payload.amount,
              currency: payload.currency,
              createdAt: now,
            },
          ],
        };

        setJournalEntries((prev) => [newJournalEntry, ...prev]);

        // Update Account Balances
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === payload.sourceAccountId) {
              return { ...acc, balance: acc.balance - payload.amount, version: acc.version + 1 };
            }
            if (acc.id === payload.destinationAccountId) {
              return { ...acc, balance: acc.balance + payload.amount, version: acc.version + 1 };
            }
            return acc;
          })
        );

        // Update Payment status to SETTLED
        setPayments((prev) =>
          prev.map((p) => (p.id === payload.paymentId ? { ...p, status: 'SETTLED', updatedAt: now } : p))
        );
      } catch (e) {
        console.error('Error processing outbox record to ledger', e);
      }
    });
  };

  // Action: Create Reversing Entry for Ledger
  const handleReverseEntry = (journalId: string, justification: string) => {
    const original = journalEntries.find((j) => j.id === journalId);
    if (!original || original.status === 'REVERSED') return;

    const now = new Date().toISOString();

    // Mark original as REVERSED
    setJournalEntries((prev) =>
      prev.map((j) => (j.id === journalId ? { ...j, status: 'REVERSED' } : j))
    );

    // Create reversing entry with swapped Debits and Credits
    const revJournalId = 'jrn_rev_' + Math.random().toString(36).substring(2, 10);
    const reversedLines = original.lines.map((l) => ({
      id: 'line_rev_' + Math.random().toString(36).substring(2, 10),
      accountId: l.accountId,
      entryType: (l.entryType === 'DEBIT' ? 'CREDIT' : 'DEBIT') as 'DEBIT' | 'CREDIT',
      amount: l.amount,
      currency: l.currency,
      createdAt: now,
    }));

    const revEntry: JournalEntryRecord = {
      id: revJournalId,
      paymentId: original.paymentId,
      eventId: 'REV_' + original.eventId,
      description: `REVERSAL: ${justification} (Ref: ${journalId})`,
      status: 'POSTED',
      reversalOfId: journalId,
      createdAt: now,
      lines: reversedLines,
    };

    setJournalEntries((prev) => [revEntry, ...prev]);

    // Restore Account Balances
    reversedLines.forEach((revLine) => {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === revLine.accountId) {
            const delta = revLine.entryType === 'DEBIT' ? revLine.amount : -revLine.amount;
            return { ...acc, balance: acc.balance + delta, version: acc.version + 1 };
          }
          return acc;
        })
      );
    });
  };

  // Action: Trigger Reconciliation Run
  const handleTriggerReconRun = (batchId: string, fileName: string) => {
    const runId = 'rcn_' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    const newRun: ReconRunRecord = {
      id: runId,
      statementBatchId: batchId,
      statementFileName: fileName,
      status: 'COMPLETED',
      totalRecords: 50,
      matchedRecords: 47,
      breaksCount: 3,
      currency: 'USD',
      executedAt: now,
      completedAt: now,
    };

    const newBreaks: ReconBreakRecord[] = [
      {
        id: 'brk_' + Math.random().toString(36).substring(2, 10),
        reconRunId: runId,
        breakType: 'AMOUNT_MISMATCH',
        status: 'UNRESOLVED',
        externalReference: 'EXT_TX_' + Math.floor(100000 + Math.random() * 900000),
        statementAmount: 180.00,
        ledgerAmount: 175.00,
        varianceAmount: 5.00,
        currency: 'USD',
        detectedAt: now,
      },
      {
        id: 'brk_' + Math.random().toString(36).substring(2, 10),
        reconRunId: runId,
        breakType: 'MISSING_IN_LEDGER',
        status: 'UNRESOLVED',
        externalReference: 'EXT_TX_' + Math.floor(100000 + Math.random() * 900000),
        statementAmount: 420.00,
        ledgerAmount: undefined,
        varianceAmount: 420.00,
        currency: 'USD',
        detectedAt: now,
      },
    ];

    setReconRuns((prev) => [newRun, ...prev]);
    setBreaks((prev) => [...newBreaks, ...prev]);
  };

  // Action: Resolve Reconciliation Break
  const handleResolveBreak = (
    breakId: string,
    action: string,
    justification: string,
    operator: string
  ) => {
    const now = new Date().toISOString();

    setBreaks((prev) =>
      prev.map((b) => (b.id === breakId ? { ...b, status: 'RESOLVED', resolvedAt: now } : b))
    );

    const auditId = 'adt_' + Math.random().toString(36).substring(2, 11);
    const newAuditLog: AuditLogRecord = {
      id: auditId,
      breakId,
      actionType: action,
      operatorUsername: operator,
      justification,
      createdAt: now,
    };

    setAuditLogs((prev) => [newAuditLog, ...prev]);
  };

  // --- New Enterprise Scenario Handlers ---

  // 1. Execute Batch Payout (POST /v1/payments/batch)
  const handleExecuteBatchPayout = (batchData: {
    batchIdempotencyKey: string;
    items: Array<{
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
      currency: string;
      reference: string;
      beneficiaryName: string;
    }>;
  }) => {
    const batchId = 'BATCH_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = new Date().toISOString();
    let batchTotal = 0;

    const generatedPayments: PaymentRecord[] = [];
    const generatedOutboxes: OutboxRecord[] = [];

    batchData.items.forEach((item, idx) => {
      batchTotal += item.amount;
      const paymentId = 'pmt_batch_' + Math.random().toString(36).substring(2, 8);
      const outboxId = 'obx_batch_' + Math.random().toString(36).substring(2, 8);

      const p: PaymentRecord = {
        id: paymentId,
        idempotencyKey: `${batchData.batchIdempotencyKey}-item-${idx}`,
        sourceAccountId: item.sourceAccountId,
        destinationAccountId: item.destinationAccountId,
        amount: item.amount,
        currency: item.currency,
        paymentMethod: 'ACH_PAYOUT',
        reference: item.reference,
        status: 'SETTLED',
        createdAt: now,
        updatedAt: now,
      };
      generatedPayments.push(p);

      const obx: OutboxRecord = {
        id: outboxId,
        aggregateId: paymentId,
        eventType: 'BatchPayoutItemSettledEvent',
        payload: JSON.stringify(p),
        traceParent: '00-batch-' + Math.random().toString(16).substring(2, 18) + '-01',
        status: 'PUBLISHED',
        retryCount: 0,
        createdAt: now,
        publishedAt: now,
      };
      generatedOutboxes.push(obx);

      // Post double-entry journal entry for each item
      const jrnId = 'jrn_batch_' + Math.random().toString(36).substring(2, 8);
      const journal: JournalEntryRecord = {
        id: jrnId,
        paymentId,
        eventId: 'evt_batch_' + idx,
        description: `Batch Payout to ${item.beneficiaryName}`,
        status: 'POSTED',
        createdAt: now,
        lines: [
          {
            id: 'line_b_dr_' + idx,
            accountId: item.sourceAccountId,
            entryType: 'DEBIT',
            amount: item.amount,
            currency: item.currency,
            createdAt: now,
          },
          {
            id: 'line_b_cr_' + idx,
            accountId: item.destinationAccountId,
            entryType: 'CREDIT',
            amount: item.amount,
            currency: item.currency,
            createdAt: now,
          },
        ],
      };
      setJournalEntries((prev) => [journal, ...prev]);

      // Update accounts
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === item.sourceAccountId) {
            return { ...acc, balance: acc.balance - item.amount, version: acc.version + 1 };
          }
          if (acc.id === item.destinationAccountId) {
            return { ...acc, balance: acc.balance + item.amount, version: acc.version + 1 };
          }
          return acc;
        })
      );
    });

    const newBatch: BatchPaymentRecord = {
      batchId,
      batchIdempotencyKey: batchData.batchIdempotencyKey,
      totalItems: batchData.items.length,
      totalAmount: batchTotal,
      currency: 'USD',
      status: 'COMPLETED',
      items: generatedPayments,
      createdAt: now,
      settledAt: now,
    };

    setBatches((prev) => [newBatch, ...prev]);
    setPayments((prev) => [...generatedPayments, ...prev]);
    setOutbox((prev) => [...generatedOutboxes, ...prev]);
  };

  // 2. Initiate Dispute (POST /v1/payments/{id}/disputes)
  const handleInitiateDispute = (paymentId: string, reason: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const disputeId = 'dsp_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();
    const disputeFee = 15.00;

    const newDispute: DisputeRecord = {
      id: disputeId,
      paymentId,
      amount: payment.amount,
      currency: payment.currency,
      reason,
      status: 'OPEN_UNDER_REVIEW',
      disputeFee,
      merchantAccountId: payment.destinationAccountId,
      evidenceNotes: 'Cardholder filed chargeback via card network. Merchant reserve held.',
      createdAt: now,
      journalEntryId: 'jrn_dsp_hold_' + disputeId,
    };

    // Mark payment with disputeId
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, disputeId } : p))
    );

    // Create Escrow Reserve Journal Entry:
    // Debit Merchant Account (withhold funds), Credit Dispute Reserve
    // Plus Card Network Dispute Fee ($15.00)
    const holdJournalId = 'jrn_dsp_hold_' + Math.random().toString(36).substring(2, 8);
    const holdJournal: JournalEntryRecord = {
      id: holdJournalId,
      paymentId,
      eventId: 'evt_dsp_hold_' + disputeId,
      description: `Dispute hold for payment ${paymentId} (${reason})`,
      status: 'POSTED',
      createdAt: now,
      lines: [
        {
          id: 'line_dsp_dr_1',
          accountId: payment.destinationAccountId,
          entryType: 'DEBIT',
          amount: payment.amount,
          currency: payment.currency,
          createdAt: now,
        },
        {
          id: 'line_dsp_cr_1',
          accountId: 'acc_dispute_reserve',
          entryType: 'CREDIT',
          amount: payment.amount,
          currency: payment.currency,
          createdAt: now,
        },
      ],
    };

    setJournalEntries((prev) => [holdJournal, ...prev]);
    setDisputes((prev) => [newDispute, ...prev]);

    // Update balances: Merchant decreased, Dispute Reserve increased
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === payment.destinationAccountId) {
          return { ...acc, balance: acc.balance - payment.amount, version: acc.version + 1 };
        }
        if (acc.id === 'acc_dispute_reserve') {
          return { ...acc, balance: acc.balance + payment.amount, version: acc.version + 1 };
        }
        return acc;
      })
    );
  };

  // 3. Resolve Dispute (POST /v1/payments/{id}/disputes/resolve)
  const handleResolveDispute = (disputeId: string, merchantWon: boolean) => {
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute || dispute.status !== 'OPEN_UNDER_REVIEW') return;

    const now = new Date().toISOString();
    const newStatus = merchantWon ? 'RESOLVED_MERCHANT_WON' : 'RESOLVED_REFUNDED';

    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: newStatus, resolvedAt: now } : d))
    );

    // Compensating entry from dispute reserve
    const resJournalId = 'jrn_dsp_res_' + Math.random().toString(36).substring(2, 8);
    const targetAccountId = merchantWon ? dispute.merchantAccountId : 'acc_cust_101';

    const resJournal: JournalEntryRecord = {
      id: resJournalId,
      paymentId: dispute.paymentId,
      eventId: 'evt_dsp_res_' + disputeId,
      description: merchantWon
        ? `Dispute won by merchant: released reserve hold for ${dispute.id}`
        : `Dispute lost: refunded customer ${dispute.id}`,
      status: 'POSTED',
      createdAt: now,
      lines: [
        {
          id: 'line_res_dr',
          accountId: 'acc_dispute_reserve',
          entryType: 'DEBIT',
          amount: dispute.amount,
          currency: dispute.currency,
          createdAt: now,
        },
        {
          id: 'line_res_cr',
          accountId: targetAccountId,
          entryType: 'CREDIT',
          amount: dispute.amount,
          currency: dispute.currency,
          createdAt: now,
        },
      ],
    };

    setJournalEntries((prev) => [resJournal, ...prev]);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === 'acc_dispute_reserve') {
          return { ...acc, balance: acc.balance - dispute.amount, version: acc.version + 1 };
        }
        if (acc.id === targetAccountId) {
          return { ...acc, balance: acc.balance + dispute.amount, version: acc.version + 1 };
        }
        return acc;
      })
    );
  };

  // 4. Execute FX Settlement (POST /v1/payments/fx-settlement)
  const handleExecuteFxSettlement = (fxData: {
    sourceAccountId: string;
    destinationAccountId: string;
    sourceAmount: number;
    sourceCurrency: string;
    targetCurrency: string;
    exchangeRate: number;
    reference: string;
  }) => {
    const fxId = 'fx_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();
    const spreadFee = 2.50; // $2.50 USD treasury fee
    const netUsdForFx = fxData.sourceAmount - spreadFee;
    const targetAmount = Number((netUsdForFx / fxData.exchangeRate).toFixed(2));

    const newFx: FxSettlementRecord = {
      id: fxId,
      sourceAccountId: fxData.sourceAccountId,
      destinationAccountId: fxData.destinationAccountId,
      sourceAmount: fxData.sourceAmount,
      sourceCurrency: fxData.sourceCurrency,
      targetAmount,
      targetCurrency: fxData.targetCurrency,
      exchangeRate: fxData.exchangeRate,
      spreadFee,
      status: 'SETTLED',
      reference: fxData.reference,
      createdAt: now,
      journalEntryId: 'jrn_fx_' + fxId,
    };

    // Multi-legged Double Entry:
    // Debit Customer USD Deposit (sourceAmount)
    // Credit FX Clearing Account (sourceAmount)
    // Credit Treasury FX Spread Revenue (spreadFee)
    // Credit Merchant Berlin EUR Account (targetAmount)
    const fxJournalId = 'jrn_fx_' + Math.random().toString(36).substring(2, 8);
    const fxJournal: JournalEntryRecord = {
      id: fxJournalId,
      paymentId: fxId,
      eventId: 'evt_fx_' + fxId,
      description: `Cross-border settlement: ${fxData.sourceAmount} USD to ${targetAmount} EUR (Rate: ${fxData.exchangeRate})`,
      status: 'POSTED',
      createdAt: now,
      lines: [
        {
          id: 'line_fx_1',
          accountId: fxData.sourceAccountId,
          entryType: 'DEBIT',
          amount: fxData.sourceAmount,
          currency: 'USD',
          createdAt: now,
        },
        {
          id: 'line_fx_2',
          accountId: fxData.destinationAccountId,
          entryType: 'CREDIT',
          amount: netUsdForFx, // In EUR book value
          currency: 'EUR',
          createdAt: now,
        },
        {
          id: 'line_fx_3',
          accountId: 'acc_fx_spread_revenue',
          entryType: 'CREDIT',
          amount: spreadFee,
          currency: 'USD',
          createdAt: now,
        },
      ],
    };

    setJournalEntries((prev) => [fxJournal, ...prev]);
    setFxSettlements((prev) => [newFx, ...prev]);

    // Update balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fxData.sourceAccountId) {
          return { ...acc, balance: acc.balance - fxData.sourceAmount, version: acc.version + 1 };
        }
        if (acc.id === fxData.destinationAccountId) {
          return { ...acc, balance: acc.balance + targetAmount, version: acc.version + 1 };
        }
        if (acc.id === 'acc_fx_spread_revenue') {
          return { ...acc, balance: acc.balance + spreadFee, version: acc.version + 1 };
        }
        return acc;
      })
    );
  };

  // 5. Automated Reconciliation with Rules (POST /v1/recon/runs/auto-match)
  const handleTriggerReconWithRules = () => {
    const runId = 'rcn_auto_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();

    const newRun: ReconRunRecord = {
      id: runId,
      statementBatchId: 'STMT_TOLERANCE_MATCH_FEED',
      statementFileName: 'chase_automated_tolerance_feed.csv',
      status: 'COMPLETED',
      totalRecords: 50,
      matchedRecords: 48,
      breaksCount: 2,
      currency: 'USD',
      executedAt: now,
      completedAt: now,
    };

    // Auto-resolve fee variance under $1.00 rule and leave 2 legitimate breaks
    const autoResolvedAudit: AuditLogRecord = {
      id: 'adt_auto_' + Math.random().toString(36).substring(2, 8),
      breakId: 'brk_auto_tol_01',
      actionType: 'AUTO_RESOLVE_TOLERANCE',
      operatorUsername: 'system_recon_engine_v3',
      justification: 'Automated resolution: $0.05 penny rounding variance absorbed into interchange expense per Rule rule_interchange_tol',
      adjustingLedgerAccount: 'acc_clearing_fee_expense',
      createdAt: now,
    };

    const remainingBreaks: ReconBreakRecord[] = [
      {
        id: 'brk_auto_01',
        reconRunId: runId,
        breakType: 'MISSING_IN_LEDGER',
        status: 'UNRESOLVED',
        externalReference: 'EXT_UNMATCHED_7718',
        statementAmount: 512.00,
        ledgerAmount: undefined,
        varianceAmount: 512.00,
        currency: 'USD',
        detectedAt: now,
      },
      {
        id: 'brk_auto_02',
        reconRunId: runId,
        breakType: 'AMOUNT_MISMATCH',
        status: 'UNRESOLVED',
        externalReference: 'EXT_VARIANCE_9921',
        statementAmount: 240.00,
        ledgerAmount: 215.00,
        varianceAmount: 25.00,
        currency: 'USD',
        detectedAt: now,
      },
    ];

    setReconRuns((prev) => [newRun, ...prev]);
    setBreaks((prev) => [...remainingBreaks, ...prev]);
    setAuditLogs((prev) => [autoResolvedAudit, ...prev]);
  };

  // 6. Split Settlement & Marketplace Fee Allocation (POST /v1/payments/split-settlement)
  const handleExecuteSplitSettlement = (splitData: {
    grossAmount: number;
    merchantAccountId: string;
    customerAccountId: string;
    interchangeRatePct: number;
    interchangeFixed: number;
    platformFeePct: number;
    rollingReservePct: number;
    reference: string;
    idempotencyKey: string;
  }) => {
    const sourceAcc = accounts.find((a) => a.id === splitData.customerAccountId);
    const destAcc = accounts.find((a) => a.id === splitData.merchantAccountId);
    if (sourceAcc?.status === 'FROZEN_AML' || destAcc?.status === 'FROZEN_AML') {
      return {
        success: false,
        error: `Transaction rejected: Account ${sourceAcc?.status === 'FROZEN_AML' ? sourceAcc.id : destAcc?.id} is currently FROZEN under AML compliance hold.`,
      };
    }

    const now = new Date().toISOString();
    const paymentId = 'pmt_split_' + Math.random().toString(36).substring(2, 10);
    const splitId = 'splt_' + Math.random().toString(36).substring(2, 10);

    const interchangeFee = Number(((splitData.grossAmount * (splitData.interchangeRatePct / 100)) + splitData.interchangeFixed).toFixed(2));
    const platformFee = Number((splitData.grossAmount * (splitData.platformFeePct / 100)).toFixed(2));
    const rollingReserveHold = Number((splitData.grossAmount * (splitData.rollingReservePct / 100)).toFixed(2));
    const merchantNetPayout = Number((splitData.grossAmount - interchangeFee - platformFee - rollingReserveHold).toFixed(2));

    const newSplitRecord: SplitSettlementRecord = {
      id: splitId,
      paymentId,
      idempotencyKey: splitData.idempotencyKey,
      grossAmount: splitData.grossAmount,
      interchangeFee,
      platformFee,
      rollingReserveHold,
      merchantNetPayout,
      currency: 'USD',
      merchantAccountId: splitData.merchantAccountId,
      customerAccountId: splitData.customerAccountId,
      status: 'SETTLED',
      reference: splitData.reference,
      createdAt: now,
      journalEntryId: 'jrn_' + splitId,
    };

    const journalId = 'jrn_' + splitId;
    const splitJournalEntry: JournalEntryRecord = {
      id: journalId,
      paymentId,
      eventId: 'evt_' + splitId,
      description: `Marketplace Split Settlement: Gross $${splitData.grossAmount.toFixed(2)} -> Net Payout $${merchantNetPayout.toFixed(2)} (Ref: ${splitData.reference})`,
      status: 'POSTED',
      createdAt: now,
      lines: [
        {
          id: 'line_sp_cust',
          accountId: splitData.customerAccountId,
          entryType: 'DEBIT',
          amount: splitData.grossAmount,
          currency: 'USD',
          createdAt: now,
        },
        {
          id: 'line_sp_merch',
          accountId: splitData.merchantAccountId,
          entryType: 'CREDIT',
          amount: merchantNetPayout,
          currency: 'USD',
          createdAt: now,
        },
        {
          id: 'line_sp_fee',
          accountId: 'acc_clearing_fee_expense',
          entryType: 'CREDIT',
          amount: interchangeFee,
          currency: 'USD',
          createdAt: now,
        },
        {
          id: 'line_sp_plat',
          accountId: 'acc_platform_fee_revenue',
          entryType: 'CREDIT',
          amount: platformFee,
          currency: 'USD',
          createdAt: now,
        },
        {
          id: 'line_sp_res',
          accountId: 'acc_merchant_rolling_reserve',
          entryType: 'CREDIT',
          amount: rollingReserveHold,
          currency: 'USD',
          createdAt: now,
        },
      ],
    };

    setSplitSettlements((prev) => [newSplitRecord, ...prev]);
    setJournalEntries((prev) => [splitJournalEntry, ...prev]);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === splitData.customerAccountId) {
          return { ...acc, balance: acc.balance - splitData.grossAmount, version: acc.version + 1 };
        }
        if (acc.id === splitData.merchantAccountId) {
          return { ...acc, balance: acc.balance + merchantNetPayout, version: acc.version + 1 };
        }
        if (acc.id === 'acc_clearing_fee_expense') {
          return { ...acc, balance: acc.balance + interchangeFee, version: acc.version + 1 };
        }
        if (acc.id === 'acc_platform_fee_revenue') {
          return { ...acc, balance: acc.balance + platformFee, version: acc.version + 1 };
        }
        if (acc.id === 'acc_merchant_rolling_reserve') {
          return { ...acc, balance: acc.balance + rollingReserveHold, version: acc.version + 1 };
        }
        return acc;
      })
    );

    return { success: true, splitRecord: newSplitRecord };
  };

  // 7. Partial & Prorated Refund Engine (POST /v1/payments/{id}/refund)
  const handleExecuteRefund = (refundData: {
    paymentId: string;
    refundAmount: number;
    reason: string;
  }) => {
    const payment = payments.find((p) => p.id === refundData.paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    const merchAcc = accounts.find((a) => a.id === payment.destinationAccountId);
    if (merchAcc?.status === 'FROZEN_AML') {
      return { success: false, error: `Refund rejected: Merchant account ${merchAcc.id} is FROZEN.` };
    }

    const priorRefunds = refunds.filter((r) => r.originalPaymentId === payment.id);
    const totalPriorRefunded = priorRefunds.reduce((sum, r) => sum + r.refundAmount, 0);
    const remainingRefundable = Number((payment.amount - totalPriorRefunded).toFixed(2));

    if (refundData.refundAmount <= 0) {
      return { success: false, error: 'Refund amount must be strictly positive.' };
    }

    if (refundData.refundAmount > remainingRefundable) {
      return {
        success: false,
        error: `Over-refund rejected! Requested $${refundData.refundAmount.toFixed(2)}, but remaining refundable balance is only $${remainingRefundable.toFixed(2)}.`,
      };
    }

    const now = new Date().toISOString();
    const refundId = 'ref_' + Math.random().toString(36).substring(2, 10);
    const ratio = refundData.refundAmount / payment.amount;
    const proRataInterchangeRefund = Number((ratio * 2.50).toFixed(2));
    const proRataPlatformFeeRefund = Number((ratio * 5.00).toFixed(2));

    const newRefund: RefundRecord = {
      id: refundId,
      originalPaymentId: payment.id,
      originalAmount: payment.amount,
      refundAmount: refundData.refundAmount,
      proRataInterchangeRefund,
      proRataPlatformFeeRefund,
      remainingRefundable: Number((remainingRefundable - refundData.refundAmount).toFixed(2)),
      currency: payment.currency,
      reason: refundData.reason,
      status: 'COMPLETED',
      createdAt: now,
      journalEntryId: 'jrn_' + refundId,
    };

    const refundJournalId = 'jrn_' + refundId;
    const refundJournal: JournalEntryRecord = {
      id: refundJournalId,
      paymentId: payment.id,
      eventId: 'evt_' + refundId,
      description: `PARTIAL REFUND: $${refundData.refundAmount.toFixed(2)} for ${payment.id} (Reason: ${refundData.reason})`,
      status: 'POSTED',
      createdAt: now,
      lines: [
        {
          id: 'line_ref_merch',
          accountId: payment.destinationAccountId,
          entryType: 'DEBIT',
          amount: refundData.refundAmount,
          currency: payment.currency,
          createdAt: now,
        },
        {
          id: 'line_ref_cust',
          accountId: payment.sourceAccountId,
          entryType: 'CREDIT',
          amount: refundData.refundAmount,
          currency: payment.currency,
          createdAt: now,
        },
      ],
    };

    setRefunds((prev) => [newRefund, ...prev]);
    setJournalEntries((prev) => [refundJournal, ...prev]);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === payment.sourceAccountId) {
          return { ...acc, balance: acc.balance + refundData.refundAmount, version: acc.version + 1 };
        }
        if (acc.id === payment.destinationAccountId) {
          return { ...acc, balance: acc.balance - refundData.refundAmount, version: acc.version + 1 };
        }
        return acc;
      })
    );

    return { success: true, refund: newRefund };
  };

  // 8. Three-Way Reconciliation Remediation (POST /v1/recon/three-way-match/remediate)
  const handleExecuteThreeWayRemediation = (itemId: string) => {
    const item = threeWayReconItems.find((i) => i.id === itemId);
    if (!item || item.resolved) return;

    const now = new Date().toISOString();

    if (item.matchStatus === 'UNPOSTED_BANK_FEE') {
      const adjJournalId = 'jrn_adj_fee_' + Math.random().toString(36).substring(2, 8);
      const adjJournal: JournalEntryRecord = {
        id: adjJournalId,
        paymentId: item.transactionReference,
        eventId: 'evt_adj_fee_' + itemId,
        description: `Automated Adjusting Entry: Unposted bank statement fee for ${item.transactionReference}`,
        status: 'POSTED',
        createdAt: now,
        lines: [
          {
            id: 'line_fee_dr',
            accountId: 'acc_clearing_fee_expense',
            entryType: 'DEBIT',
            amount: item.varianceAmount,
            currency: 'USD',
            createdAt: now,
          },
          {
            id: 'line_cash_cr',
            accountId: 'acc_cash_clearing_usd',
            entryType: 'CREDIT',
            amount: item.varianceAmount,
            currency: 'USD',
            createdAt: now,
          },
        ],
      };

      setJournalEntries((prev) => [adjJournal, ...prev]);
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === 'acc_clearing_fee_expense') {
            return { ...acc, balance: acc.balance + item.varianceAmount, version: acc.version + 1 };
          }
          if (acc.id === 'acc_cash_clearing_usd') {
            return { ...acc, balance: acc.balance - item.varianceAmount, version: acc.version + 1 };
          }
          return acc;
        })
      );
    } else if (item.matchStatus === 'GATEWAY_DROP') {
      const voidJournalId = 'jrn_void_drop_' + Math.random().toString(36).substring(2, 8);
      const voidJournal: JournalEntryRecord = {
        id: voidJournalId,
        paymentId: item.transactionReference,
        eventId: 'evt_void_' + itemId,
        description: `Provisional Entry Voided: Gateway capture missing in processor settlement (${item.transactionReference})`,
        status: 'POSTED',
        createdAt: now,
        lines: [
          {
            id: 'line_void_merch',
            accountId: 'acc_merch_202',
            entryType: 'DEBIT',
            amount: item.varianceAmount,
            currency: 'USD',
            createdAt: now,
          },
          {
            id: 'line_void_cash',
            accountId: 'acc_cash_clearing_usd',
            entryType: 'CREDIT',
            amount: item.varianceAmount,
            currency: 'USD',
            createdAt: now,
          },
        ],
      };
      setJournalEntries((prev) => [voidJournal, ...prev]);
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === 'acc_merch_202') {
            return { ...acc, balance: acc.balance - item.varianceAmount, version: acc.version + 1 };
          }
          if (acc.id === 'acc_cash_clearing_usd') {
            return { ...acc, balance: acc.balance + item.varianceAmount, version: acc.version + 1 };
          }
          return acc;
        })
      );
    }

    setThreeWayReconItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, resolved: true, resolvedAt: now } : i))
    );
  };

  // 9. Treasury Liquidity Sweep (POST /v1/treasury/sweep)
  const handleExecuteTreasurySweep = (sweepData: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    sweepType: 'OVERNIGHT_MONEY_MARKET' | 'INTERCOMPANY_DUE_TO_FROM' | 'OPERATIONAL_MINIMUM_RESERVE';
    reference: string;
  }) => {
    const now = new Date().toISOString();
    const sweepId = 'swp_' + Math.random().toString(36).substring(2, 10);
    const journalId = 'jrn_' + sweepId;

    const newSweep: TreasurySweepRecord = {
      id: sweepId,
      sourceAccountId: sweepData.sourceAccountId,
      destinationAccountId: sweepData.destinationAccountId,
      amount: sweepData.amount,
      currency: 'USD',
      sweepType: sweepData.sweepType,
      reference: sweepData.reference,
      status: 'EXECUTED',
      createdAt: now,
      journalEntryId: journalId,
    };

    const sweepJournal: JournalEntryRecord = {
      id: journalId,
      paymentId: sweepId,
      eventId: 'evt_' + sweepId,
      description: `Treasury Liquidity Sweep: $${sweepData.amount.toLocaleString()} -> ${sweepData.sweepType} (Ref: ${sweepData.reference})`,
      status: 'POSTED',
      createdAt: now,
      lines: [
        {
          id: 'line_swp_dest',
          accountId: sweepData.destinationAccountId,
          entryType: 'DEBIT',
          amount: sweepData.amount,
          currency: 'USD',
          createdAt: now,
        },
        {
          id: 'line_swp_src',
          accountId: sweepData.sourceAccountId,
          entryType: 'CREDIT',
          amount: sweepData.amount,
          currency: 'USD',
          createdAt: now,
        },
      ],
    };

    setTreasurySweeps((prev) => [newSweep, ...prev]);
    setJournalEntries((prev) => [sweepJournal, ...prev]);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === sweepData.destinationAccountId) {
          return { ...acc, balance: acc.balance + sweepData.amount, version: acc.version + 1 };
        }
        if (acc.id === sweepData.sourceAccountId) {
          return { ...acc, balance: acc.balance - sweepData.amount, version: acc.version + 1 };
        }
        return acc;
      })
    );
  };

  // 10. AML / Compliance Freeze Toggle (POST /v1/accounts/{id}/freeze)
  const handleToggleAccountFreeze = (accountId: string, reason: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const isCurrentlyFrozen = acc.status === 'FROZEN_AML' || acc.status === 'FROZEN_COMPLIANCE';
          return {
            ...acc,
            status: isCurrentlyFrozen ? 'ACTIVE' : 'FROZEN_AML',
            freezeReason: isCurrentlyFrozen ? undefined : reason,
            version: acc.version + 1,
          };
        }
        return acc;
      })
    );
  };

  const pendingOutboxCount = outbox.filter((o) => o.status === 'PENDING').length;
  const unresolvedBreaksCount = breaks.filter((b) => b.status === 'UNRESOLVED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingOutboxCount={pendingOutboxCount}
        unresolvedBreaksCount={unresolvedBreaksCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1st Tab: Live Operations & Workflows (Merged Workflows & Microservices Studio) */}
        {(activeTab === 'operations' || activeTab === 'scenarios' || activeTab === 'studio') && (
          <RealWorldScenarios
            payments={payments}
            accounts={accounts}
            journalEntries={journalEntries}
            batches={batches}
            disputes={disputes}
            fxSettlements={fxSettlements}
            reconRules={reconRules}
            reconRuns={reconRuns}
            breaks={breaks}
            splitSettlements={splitSettlements}
            refunds={refunds}
            threeWayReconItems={threeWayReconItems}
            treasurySweeps={treasurySweeps}
            outbox={outbox}
            kafkaMessages={kafkaMessages}
            auditLogs={auditLogs}
            onExecuteBatchPayout={handleExecuteBatchPayout}
            onInitiateDispute={handleInitiateDispute}
            onResolveDispute={handleResolveDispute}
            onExecuteFxSettlement={handleExecuteFxSettlement}
            onTriggerReconWithRules={handleTriggerReconWithRules}
            onExecuteSplitSettlement={handleExecuteSplitSettlement}
            onExecuteRefund={handleExecuteRefund}
            onExecuteThreeWayRemediation={handleExecuteThreeWayRemediation}
            onExecuteTreasurySweep={handleExecuteTreasurySweep}
            onToggleAccountFreeze={handleToggleAccountFreeze}
            onInitiatePayment={handleInitiatePayment}
            onDrainOutbox={handleDrainOutbox}
            onReverseEntry={handleReverseEntry}
            onTriggerReconRun={handleTriggerReconRun}
            onResolveBreak={handleResolveBreak}
          />
        )}

        {/* 2nd Tab: Core Features & Advantages */}
        {activeTab === 'capabilities' && <SystemCapabilities />}

        {/* 3rd Tab: System Architecture */}
        {activeTab === 'architecture' && <ArchitectureView />}

        {/* 4th Tab: Distributed Failure Scenarios */}
        {activeTab === 'failures' && <FailureSimulator />}

        {/* 5th Tab: Codebase & Repositories */}
        {activeTab === 'code' && <CodeExplorer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">
            Payment ledger and reconciliation platform • Enterprise Multi-Rail Payment Core & Autonomous Reconciliation
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-slate-600">
            <span className="text-blue-700 font-bold">React 18</span>
            <span>•</span>
            <span>Vite</span>
            <span>•</span>
            <span>Java 21</span>
            <span>•</span>
            <span>Spring Boot 3</span>
            <span>•</span>
            <span>PostgreSQL 16</span>
            <span>•</span>
            <span>Kafka 3.7</span>
            <span>•</span>
            <span>Redis 7</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

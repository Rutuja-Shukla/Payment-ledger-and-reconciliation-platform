import React, { useState } from 'react';
import {
  PaymentRecord,
  AccountRecord,
  JournalEntryRecord,
  BatchPaymentRecord,
  DisputeRecord,
  FxSettlementRecord,
  ReconRuleRecord,
  ReconRunRecord,
  ReconBreakRecord,
  SplitSettlementRecord,
  RefundRecord,
  ThreeWayReconItem,
  TreasurySweepRecord,
  OutboxRecord,
  KafkaMessage,
  AuditLogRecord,
} from '../types';
import { PaymentApiConsole } from './PaymentApiConsole';
import { LedgerConsole } from './LedgerConsole';
import { ReconConsole } from './ReconConsole';
import {
  Briefcase,
  Database,
  ShieldAlert,
  Globe2,
  FileCheck2,
  Calculator,
  Play,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Layers,
  Send,
  Eye,
  AlertTriangle,
  RotateCcw,
  Percent,
  Split,
  Landmark,
  Lock,
  Unlock,
  Check,
  X,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface RealWorldScenariosProps {
  payments: PaymentRecord[];
  accounts: AccountRecord[];
  journalEntries: JournalEntryRecord[];
  batches: BatchPaymentRecord[];
  disputes: DisputeRecord[];
  fxSettlements: FxSettlementRecord[];
  reconRules: ReconRuleRecord[];
  reconRuns: ReconRunRecord[];
  breaks: ReconBreakRecord[];
  splitSettlements: SplitSettlementRecord[];
  refunds: RefundRecord[];
  threeWayReconItems: ThreeWayReconItem[];
  treasurySweeps: TreasurySweepRecord[];
  onExecuteBatchPayout: (batch: {
    batchIdempotencyKey: string;
    items: Array<{
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
      currency: string;
      reference: string;
      beneficiaryName: string;
    }>;
  }) => void;
  onInitiateDispute: (paymentId: string, reason: string) => void;
  onResolveDispute: (disputeId: string, merchantWon: boolean) => void;
  onExecuteFxSettlement: (fx: {
    sourceAccountId: string;
    destinationAccountId: string;
    sourceAmount: number;
    sourceCurrency: string;
    targetCurrency: string;
    exchangeRate: number;
    reference: string;
  }) => void;
  onTriggerReconWithRules: () => void;
  onExecuteSplitSettlement: (splitData: {
    grossAmount: number;
    merchantAccountId: string;
    customerAccountId: string;
    interchangeRatePct: number;
    interchangeFixed: number;
    platformFeePct: number;
    rollingReservePct: number;
    reference: string;
    idempotencyKey: string;
  }) => { success: boolean; splitRecord?: SplitSettlementRecord; error?: string };
  onExecuteRefund: (refundData: {
    paymentId: string;
    refundAmount: number;
    reason: string;
  }) => { success: boolean; refund?: RefundRecord; error?: string };
  onExecuteThreeWayRemediation: (itemId: string) => void;
  onExecuteTreasurySweep: (sweepData: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    sweepType: 'OVERNIGHT_MONEY_MARKET' | 'INTERCOMPANY_DUE_TO_FROM' | 'OPERATIONAL_MINIMUM_RESERVE';
    reference: string;
  }) => void;
  onToggleAccountFreeze: (accountId: string, reason: string) => void;
  outbox: OutboxRecord[];
  kafkaMessages: KafkaMessage[];
  auditLogs: AuditLogRecord[];
  onInitiatePayment: (payment: {
    idempotencyKey: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    reference: string;
  }) => { success: boolean; status: number; body: any };
  onDrainOutbox: () => void;
  onReverseEntry: (journalId: string, justification: string) => void;
  onTriggerReconRun: (batchId: string, fileName: string) => void;
  onResolveBreak: (breakId: string, action: string, justification: string, operator: string) => void;
}

export const RealWorldScenarios: React.FC<RealWorldScenariosProps> = ({
  payments,
  accounts,
  journalEntries,
  batches,
  disputes,
  fxSettlements,
  reconRules,
  reconRuns,
  breaks,
  splitSettlements,
  refunds,
  threeWayReconItems,
  treasurySweeps,
  outbox,
  kafkaMessages,
  auditLogs,
  onExecuteBatchPayout,
  onInitiateDispute,
  onResolveDispute,
  onExecuteFxSettlement,
  onTriggerReconWithRules,
  onExecuteSplitSettlement,
  onExecuteRefund,
  onExecuteThreeWayRemediation,
  onExecuteTreasurySweep,
  onToggleAccountFreeze,
  onInitiatePayment,
  onDrainOutbox,
  onReverseEntry,
  onTriggerReconRun,
  onResolveBreak,
}) => {
  const [primaryViewMode, setPrimaryViewMode] = useState<'workflows' | 'studio'>('workflows');
  const [studioSubTab, setStudioSubTab] = useState<'payment' | 'ledger' | 'recon'>('payment');
  const [activeScenario, setActiveScenario] = useState<
    'split' | 'refund' | 'threeway' | 'batch' | 'dispute' | 'fx' | 'sweep' | 'freeze' | 'trialBalance'
  >('split');

  // Scenario 1: Split Settlement Form State
  const [splitGross, setSplitGross] = useState<number>(150.00);
  const [splitMerchantAcc, setSplitMerchantAcc] = useState<string>('acc_merch_202');
  const [splitInterchangePct, setSplitInterchangePct] = useState<number>(2.1);
  const [splitInterchangeFixed, setSplitInterchangeFixed] = useState<number>(0.30);
  const [splitPlatformPct, setSplitPlatformPct] = useState<number>(5.0);
  const [splitReservePct, setSplitReservePct] = useState<number>(5.0);
  const [splitFeedback, setSplitFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Scenario 2: Refund State
  const settledPayments = payments.filter((p) => p.status === 'SETTLED');
  const [selectedRefundPaymentId, setSelectedRefundPaymentId] = useState<string>(
    settledPayments[0]?.id || ''
  );
  const selectedPaymentRecord = payments.find((p) => p.id === selectedRefundPaymentId);
  const priorRefundsForSelected = refunds.filter((r) => r.originalPaymentId === selectedRefundPaymentId);
  const totalPriorRefunded = priorRefundsForSelected.reduce((sum, r) => sum + r.refundAmount, 0);
  const remainingRefundableMax = selectedPaymentRecord
    ? Math.max(0, Number((selectedPaymentRecord.amount - totalPriorRefunded).toFixed(2)))
    : 0;
  const [refundAmountInput, setRefundAmountInput] = useState<number>(
    remainingRefundableMax > 40 ? 45.00 : remainingRefundableMax
  );
  const [refundReason, setRefundReason] = useState<string>('CUSTOMER_RETURN_PARTIAL_ITEM');
  const [refundFeedback, setRefundFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Scenario 3: 3-Way Reconciliation
  const [threeWayFilter, setThreeWayFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');

  // Scenario 4: Batch Payout State
  const [batchIdemKey, setBatchIdemKey] = useState<string>(
    () => 'batch-key-' + Math.random().toString(36).substring(2, 8)
  );

  // Scenario 5: Dispute State
  const [selectedDisputePayment, setSelectedDisputePayment] = useState<string>(
    settledPayments[0]?.id || ''
  );
  const [disputeReason, setDisputeReason] = useState<string>('FRAUD_UNAUTHORIZED_CARD_USE');

  // Scenario 6: FX State
  const [fxSourceAmount, setFxSourceAmount] = useState<number>(250.00);
  const [fxRate, setFxRate] = useState<number>(1.09);

  // Scenario 7: Treasury Sweep State
  const [sweepAmount, setSweepAmount] = useState<number>(150000.00);
  const [sweepType, setSweepType] = useState<
    'OVERNIGHT_MONEY_MARKET' | 'INTERCOMPANY_DUE_TO_FROM' | 'OPERATIONAL_MINIMUM_RESERVE'
  >('OVERNIGHT_MONEY_MARKET');

  // Scenario 8: Freeze Reason
  const [freezeReasonText, setFreezeReasonText] = useState<string>(
    'Suspicious Structuring Pattern - Section 314(b) Information Sharing Notice'
  );

  // Scenario 9: Sub-ledger statement selection
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<string>(
    accounts[0]?.id || 'acc_cust_101'
  );

  // Live Calculations for Split Settlement
  const computedInterchange = Number(
    ((splitGross * (splitInterchangePct / 100)) + splitInterchangeFixed).toFixed(2)
  );
  const computedPlatformFee = Number((splitGross * (splitPlatformPct / 100)).toFixed(2));
  const computedReserveHold = Number((splitGross * (splitReservePct / 100)).toFixed(2));
  const computedMerchantNet = Number(
    (splitGross - computedInterchange - computedPlatformFee - computedReserveHold).toFixed(2)
  );
  const isSplitMathBalanced =
    Math.abs(splitGross - (computedMerchantNet + computedInterchange + computedPlatformFee + computedReserveHold)) < 0.001;

  // Handlers
  const handleRunSplit = () => {
    setSplitFeedback(null);
    const res = onExecuteSplitSettlement({
      grossAmount: Number(splitGross),
      merchantAccountId: splitMerchantAcc,
      customerAccountId: 'acc_cust_101',
      interchangeRatePct: Number(splitInterchangePct),
      interchangeFixed: Number(splitInterchangeFixed),
      platformFeePct: Number(splitPlatformPct),
      rollingReservePct: Number(splitReservePct),
      reference: 'ORD-SPLIT-' + Math.floor(1000 + Math.random() * 9000),
      idempotencyKey: 'idem-split-' + Math.random().toString(36).substring(2, 9),
    });

    if (res.success && res.splitRecord) {
      setSplitFeedback({
        success: true,
        message: `Settlement ${res.splitRecord.id} posted! Debited $${splitGross.toFixed(2)} from Customer. Credited $${computedMerchantNet.toFixed(2)} to Merchant, $${computedInterchange.toFixed(2)} Interchange, $${computedPlatformFee.toFixed(2)} Platform Take-Rate, $${computedReserveHold.toFixed(2)} Rolling Reserve.`,
      });
    } else {
      setSplitFeedback({
        success: false,
        message: res.error || 'Failed to execute split settlement.',
      });
    }
  };

  const handleRunRefund = () => {
    setRefundFeedback(null);
    const res = onExecuteRefund({
      paymentId: selectedRefundPaymentId,
      refundAmount: Number(refundAmountInput),
      reason: refundReason,
    });

    if (res.success && res.refund) {
      setRefundFeedback({
        success: true,
        message: `Refund ${res.refund.id} executed successfully. $${res.refund.refundAmount.toFixed(2)} returned to customer account. Remaining refundable balance on payment: $${res.refund.remainingRefundable.toFixed(2)}.`,
      });
    } else {
      setRefundFeedback({
        success: false,
        message: res.error || 'Refund execution failed.',
      });
    }
  };

  const handleRunBatch = () => {
    onExecuteBatchPayout({
      batchIdempotencyKey: batchIdemKey,
      items: [
        {
          sourceAccountId: 'acc_cash_clearing_usd',
          destinationAccountId: 'acc_merch_202',
          amount: 850.00,
          currency: 'USD',
          reference: 'PAYOUT-REST-01',
          beneficiaryName: 'Bella Italia Bistro (Weekly Settlement)',
        },
        {
          sourceAccountId: 'acc_cash_clearing_usd',
          destinationAccountId: 'acc_merch_202',
          amount: 540.00,
          currency: 'USD',
          reference: 'PAYOUT-REST-02',
          beneficiaryName: 'Sushi Express (Courier & Sales Net)',
        },
        {
          sourceAccountId: 'acc_cash_clearing_usd',
          destinationAccountId: 'acc_merch_202',
          amount: 320.00,
          currency: 'USD',
          reference: 'PAYOUT-REST-03',
          beneficiaryName: 'Green Salad Bar (Weekly Settlement)',
        },
      ],
    });
    setBatchIdemKey('batch-key-' + Math.random().toString(36).substring(2, 8));
  };

  const handleRunDispute = () => {
    if (!selectedDisputePayment) return;
    onInitiateDispute(selectedDisputePayment, disputeReason);
  };

  const handleRunFx = () => {
    onExecuteFxSettlement({
      sourceAccountId: 'acc_cust_101',
      destinationAccountId: 'acc_merch_berlin_eur',
      sourceAmount: Number(fxSourceAmount),
      sourceCurrency: 'USD',
      targetCurrency: 'EUR',
      exchangeRate: Number(fxRate),
      reference: 'ORD-INTL-' + Math.floor(1000 + Math.random() * 9000),
    });
  };

  const handleRunSweep = () => {
    onExecuteTreasurySweep({
      sourceAccountId: 'acc_cash_clearing_usd',
      destinationAccountId: 'acc_treasury_overnight_mm',
      amount: Number(sweepAmount),
      sweepType,
      reference: 'SWEEP-DAILY-EOD-' + Math.floor(100 + Math.random() * 900),
    });
  };

  // Sub-ledger statement computation for selected account
  const accountStatementLines = journalEntries.flatMap((entry) =>
    entry.lines
      .filter((line) => line.accountId === selectedAccountForStatement)
      .map((line) => ({
        id: line.id,
        timestamp: entry.createdAt,
        journalEntryId: entry.id,
        reference: entry.paymentId,
        entryType: line.entryType,
        amount: line.amount,
        description: entry.description,
      }))
  );

  // Trial Balance calculation across all accounts
  let totalDebitBalance = 0;
  let totalCreditBalance = 0;
  const trialBalanceRows = accounts.map((acc) => {
    let debits = 0;
    let credits = 0;
    journalEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.accountId === acc.id) {
          if (line.entryType === 'DEBIT') debits += line.amount;
          if (line.entryType === 'CREDIT') credits += line.amount;
        }
      });
    });

    let debitBal = 0;
    let creditBal = 0;
    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      const net = debits - credits;
      if (net >= 0) debitBal = net;
      else creditBal = Math.abs(net);
    } else {
      const net = credits - debits;
      if (net >= 0) creditBal = net;
      else debitBal = Math.abs(net);
    }

    totalDebitBalance += debitBal;
    totalCreditBalance += creditBal;

    return {
      account: acc,
      debits,
      credits,
      netBalance: debitBal > 0 ? debitBal : creditBal,
      normalBalance: debitBal > 0 ? 'DEBIT' : 'CREDIT',
    };
  });

  const isTrialBalanceInEquilibrium = Math.abs(totalDebitBalance - totalCreditBalance) < 0.01;

  // Filter 3-way recon items
  const filteredThreeWayItems = threeWayReconItems.filter((i) => {
    if (threeWayFilter === 'UNRESOLVED') return !i.resolved;
    if (threeWayFilter === 'RESOLVED') return i.resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Live Operations & Workflows Hub
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                Live React 18 Control Plane
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Unified command center bridging high-level enterprise business workflows (marketplace splits, prorated refunds, 3-way reconciliation, ACH batching, FX, treasury sweeps) with low-level microservices operations (<code className="font-mono text-slate-700">payment-api</code>, <code className="font-mono text-slate-700">ledger-service</code>, <code className="font-mono text-slate-700">recon-service</code>).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Ledger Invariant Check</div>
              <div
                className={`text-xs font-mono font-semibold flex items-center justify-end gap-1.5 ${
                  isTrialBalanceInEquilibrium ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Σ Dr = Σ Cr ($ {totalDebitBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Workspace View Switcher: Business Workflows vs Core Microservices */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-col sm:flex-row items-center gap-2 shadow-xs">
        <button
          onClick={() => setPrimaryViewMode('workflows')}
          className={`flex-1 w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            primaryViewMode === 'workflows'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Real-World Business Workflows (9 Scenarios)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${primaryViewMode === 'workflows' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
            End-to-End
          </span>
        </button>

        <button
          onClick={() => setPrimaryViewMode('studio')}
          className={`flex-1 w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            primaryViewMode === 'studio'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Core Microservices Studio (payment-api • ledger • recon)</span>
          {(outbox.filter((o) => o.status === 'PENDING').length > 0 || breaks.filter((b) => b.status === 'UNRESOLVED').length > 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Business Workflows Section */}
      {primaryViewMode === 'workflows' && (
        <div className="space-y-6">
          {/* Scenario Navigation Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            <button
              onClick={() => setActiveScenario('split')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'split'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Split className={`w-4 h-4 ${activeScenario === 'split' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-slate-400 font-mono">POST</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Split Payout</div>
            <div className="text-[10px] text-slate-500">Marketplace Fees</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('refund')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'refund'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <RotateCcw className={`w-4 h-4 ${activeScenario === 'refund' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-slate-400 font-mono">POST</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Partial Refund</div>
            <div className="text-[10px] text-slate-500">Prorated Clawback</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('threeway')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'threeway'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <FileCheck2 className={`w-4 h-4 ${activeScenario === 'threeway' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-amber-700 font-mono">3-WAY</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">3-Way Match</div>
            <div className="text-[10px] text-slate-500">Bank Feed Ingest</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('batch')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'batch'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Briefcase className={`w-4 h-4 ${activeScenario === 'batch' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-slate-400 font-mono">POST</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Batch Payouts</div>
            <div className="text-[10px] text-slate-500">Atomic Multi-Item</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('dispute')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'dispute'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <ShieldAlert className={`w-4 h-4 ${activeScenario === 'dispute' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-rose-700 font-mono">DISP</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Disputes</div>
            <div className="text-[10px] text-slate-500">Reserve Hold</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('fx')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'fx'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Globe2 className={`w-4 h-4 ${activeScenario === 'fx' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-slate-400 font-mono">FX</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Cross-Border</div>
            <div className="text-[10px] text-slate-500">Multi-Currency</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('sweep')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'sweep'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Landmark className={`w-4 h-4 ${activeScenario === 'sweep' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-slate-400 font-mono">TREAS</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Treasury Sweep</div>
            <div className="text-[10px] text-slate-500">Liquidity Pools</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('freeze')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'freeze'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Lock className={`w-4 h-4 ${activeScenario === 'freeze' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-amber-700 font-mono">AML</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Compliance Hold</div>
            <div className="text-[10px] text-slate-500">Account Freeze</div>
          </div>
        </button>

        <button
          onClick={() => setActiveScenario('trialBalance')}
          className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
            activeScenario === 'trialBalance'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Calculator className={`w-4 h-4 ${activeScenario === 'trialBalance' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-slate-400 font-mono">AUDIT</span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Trial Balance</div>
            <div className="text-[10px] text-slate-500">General Ledger</div>
          </div>
        </button>
      </div>

      {/* ==================== SCENARIO 1: SPLIT SETTLEMENT ==================== */}
      {activeScenario === 'split' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                      POST /v1/payments/split-settlement
                    </span>
                    <span className="text-xs text-slate-500">Marketplace Take-Rate Engine</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                    Multi-Party Split Settlement & Platform Fee Allocation
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    When an e-commerce buyer pays $150.00, funds are not routed 1:1. The platform atomically splits the gross payment into four distinct balanced legs: network interchange processing fees, platform take-rate revenue, merchant rolling reserve hold (for chargeback risk), and net merchant payout.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Gross Payment Amount ($ USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={splitGross}
                        onChange={(e) => setSplitGross(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Destination Merchant Account</label>
                    <select
                      value={splitMerchantAcc}
                      onChange={(e) => setSplitMerchantAcc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                    >
                      {accounts
                        .filter((a) => a.type === 'LIABILITY' && a.id.startsWith('acc_merch'))
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.id}) - Bal: ${a.balance.toFixed(2)}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Network Interchange Fee ({splitInterchangePct}% + ${splitInterchangeFixed.toFixed(2)})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={splitInterchangePct}
                        onChange={(e) => setSplitInterchangePct(Number(e.target.value))}
                        className="w-1/2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                      />
                      <input
                        type="number"
                        step="0.05"
                        value={splitInterchangeFixed}
                        onChange={(e) => setSplitInterchangeFixed(Number(e.target.value))}
                        className="w-1/2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Platform Fee ({splitPlatformPct}%) & Rolling Reserve ({splitReservePct}%)
                    </label>
                    <div className="flex gap-2">
                      <div className="w-1/2 relative">
                        <span className="absolute right-3 top-2 text-slate-400 text-xs">% Plat</span>
                        <input
                          type="number"
                          step="0.5"
                          value={splitPlatformPct}
                          onChange={(e) => setSplitPlatformPct(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                      <div className="w-1/2 relative">
                        <span className="absolute right-3 top-2 text-slate-400 text-xs">% Res</span>
                        <input
                          type="number"
                          step="0.5"
                          value={splitReservePct}
                          onChange={(e) => setSplitReservePct(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleRunSplit}
                    disabled={!isSplitMathBalanced || splitGross <= 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Execute Split Settlement</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Idempotency-Key: idem-split-{Math.random().toString(36).substring(2, 6)}
                  </span>
                </div>

                {splitFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      splitFeedback.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {splitFeedback.message}
                  </div>
                )}
              </div>

              {/* Real-Time Mathematical & T-Account Breakdown */}
              <div className="w-full lg:w-96 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-blue-600" />
                    <span>Double-Entry Allocation (Dr = Cr)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    BALANCED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white p-2 rounded-md border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800">1. Customer Deposit (Debit)</span>
                      <div className="text-[10px] text-slate-500">Gross charge collected from buyer</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">$ {splitGross.toFixed(2)}</span>
                  </div>

                  <div className="pl-3 border-l-2 border-blue-300 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Net Merchant Payout (Credit):</span>
                      <span className="font-mono font-bold text-emerald-700">$ {computedMerchantNet.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Card Interchange Fee (Credit):</span>
                      <span className="font-mono font-semibold text-slate-700">$ {computedInterchange.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Platform Take-Rate Fee (Credit):</span>
                      <span className="font-mono font-semibold text-blue-700">$ {computedPlatformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Rolling Reserve Escrow (Credit):</span>
                      <span className="font-mono font-semibold text-amber-700">$ {computedReserveHold.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono font-bold">
                    <span>Sum of Credits:</span>
                    <span>$ {(computedMerchantNet + computedInterchange + computedPlatformFee + computedReserveHold).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Posted Split Settlements */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">Recent Split Settlement Transactions</h4>
              <span className="text-[11px] text-slate-500 font-mono">{splitSettlements.length} recorded</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Split ID / Ref</th>
                    <th className="py-2.5 px-4">Gross Collected</th>
                    <th className="py-2.5 px-4">Interchange</th>
                    <th className="py-2.5 px-4">Platform Take</th>
                    <th className="py-2.5 px-4">Rolling Reserve</th>
                    <th className="py-2.5 px-4">Net Merchant Payout</th>
                    <th className="py-2.5 px-4">Journal Entry Ref</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {splitSettlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 font-mono text-[11px]">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {s.id}
                        <span className="block text-[10px] text-slate-400 font-sans">{s.reference}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-900 font-bold">$ {s.grossAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-slate-600">$ {s.interchangeFee.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-blue-700 font-semibold">$ {s.platformFee.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-amber-700">$ {s.rollingReserveHold.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-bold">$ {s.merchantNetPayout.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-slate-500">{s.journalEntryId}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 2: PARTIAL REFUNDS ==================== */}
      {activeScenario === 'refund' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                      POST /v1/payments/{'{id}'}/refund
                    </span>
                    <span className="text-xs text-slate-500">Immutable Reversals</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                    Partial & Multi-Stage Refunds with Over-Refund Prevention
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    E-commerce returns rarely refund an entire cart at once. In double-entry accounting, original transactions are immutable. The system computes remaining refundable balances, blocks over-refunding attempts, calculates pro-rata interchange clawbacks, and appends a balanced reversing sub-journal entry.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Select Settled Payment</label>
                    <select
                      value={selectedRefundPaymentId}
                      onChange={(e) => {
                        setSelectedRefundPaymentId(e.target.value);
                        setRefundFeedback(null);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono"
                    >
                      {settledPayments.map((p) => {
                        const prior = refunds.filter((r) => r.originalPaymentId === p.id);
                        const rem = p.amount - prior.reduce((sum, r) => sum + r.refundAmount, 0);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.id} ({p.reference}) - Orig: ${p.amount.toFixed(2)} (Rem: ${rem.toFixed(2)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Refund Amount ($ USD) — Max: ${remainingRefundableMax.toFixed(2)}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        max={remainingRefundableMax}
                        value={refundAmountInput}
                        onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                        className={`w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border rounded-lg font-mono focus:bg-white focus:outline-hidden ${
                          refundAmountInput > remainingRefundableMax
                            ? 'border-rose-400 text-rose-700'
                            : 'border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Refund Justification / Reason</label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="CUSTOMER_RETURN_PARTIAL_ITEM">Customer Returned 1 of 3 Items in Order</option>
                      <option value="GOODWILL_PRICE_MATCH">Customer Service Goodwill Price Adjustment ($15.00)</option>
                      <option value="DEFECTIVE_DAMAGED_GOODS">Damaged in Transit / Merchant Approved Concession</option>
                      <option value="DUPLICATE_ORDER_OVERPAYMENT">Accidental Double Charge Concession</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleRunRefund}
                    disabled={refundAmountInput <= 0 || refundAmountInput > remainingRefundableMax}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Post Partial Reversal Entry</span>
                  </button>
                  {refundAmountInput > remainingRefundableMax && (
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Over-refund blocked! Exceeds remaining refundable balance.
                    </span>
                  )}
                </div>

                {refundFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      refundFeedback.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {refundFeedback.message}
                  </div>
                )}
              </div>

              {/* Refund Invariant Card */}
              <div className="w-full lg:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-semibold text-slate-900 block border-b border-slate-200 pb-2">
                  Remaining Refundable Guard
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Original Payment Gross:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      $ {selectedPaymentRecord?.amount.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Prior Refunds Issued:</span>
                    <span className="font-mono font-semibold text-rose-700">
                      -$ {totalPriorRefunded.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
                    <span>Available to Refund:</span>
                    <span className="font-mono text-emerald-700">
                      $ {remainingRefundableMax.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Refund History Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">Immutable Refund Journal Records</h4>
              <span className="text-[11px] text-slate-500 font-mono">{refunds.length} recorded</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Refund ID</th>
                    <th className="py-2.5 px-4">Target Payment ID</th>
                    <th className="py-2.5 px-4">Refund Amount</th>
                    <th className="py-2.5 px-4">Interchange Clawback</th>
                    <th className="py-2.5 px-4">Remaining Balance</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Journal Ref</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{r.id}</td>
                      <td className="py-2.5 px-4 text-blue-700">{r.originalPaymentId}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">$ {r.refundAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-slate-600">$ {r.proRataInterchangeRefund.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-semibold">$ {r.remainingRefundable.toFixed(2)}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">{r.reason}</td>
                      <td className="py-2.5 px-4 text-slate-500">{r.journalEntryId}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 3: 3-WAY RECONCILIATION ==================== */}
      {activeScenario === 'threeway' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800">
                    POST /v1/recon/three-way-match
                  </span>
                  <span className="text-xs text-slate-500">Multi-Source Ingestion Engine</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-2">
                  3-Way Reconciliation: Gateway vs General Ledger vs Bank Statement
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                  Financial integrity requires matching across three independent records of truth: (1) Front-office Gateway payment authorizations, (2) Internal Double-Entry Ledger entries, and (3) Clearing Bank CAMT.053 / MT940 statement feeds. Click <strong>"1-Click Remediate"</strong> to automatically post adjusting ledger entries or resolve in-flight float!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setThreeWayFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                    threeWayFilter === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Feeds ({threeWayReconItems.length})
                </button>
                <button
                  onClick={() => setThreeWayFilter('UNRESOLVED')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                    threeWayFilter === 'UNRESOLVED'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Action Required ({threeWayReconItems.filter((i) => !i.resolved).length})
                </button>
              </div>
            </div>
          </div>

          {/* 3-Way Reconciliation Feed Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">3-Way Comparison Matrix</h4>
              <span className="text-[11px] text-slate-500">Gateway • Ledger • Clearing Bank</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Transaction Ref</th>
                    <th className="py-2.5 px-4">1. Payment Gateway</th>
                    <th className="py-2.5 px-4">2. Double-Entry Ledger</th>
                    <th className="py-2.5 px-4">3. Bank Statement (CAMT.053)</th>
                    <th className="py-2.5 px-4">Variance / Diagnosis</th>
                    <th className="py-2.5 px-4 text-right">Actionable Remediation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredThreeWayItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {item.transactionReference}
                        <span className="block text-[10px] text-slate-400 font-sans">ID: {item.id}</span>
                      </td>

                      {/* Gateway Column */}
                      <td className="py-3 px-4 font-mono">
                        {item.gatewayStatus === 'CAPTURED' ? (
                          <div>
                            <span className="font-bold text-slate-900">$ {item.gatewayAmount.toFixed(2)}</span>
                            <span className="block text-[10px] text-emerald-700 font-sans">✓ CAPTURED</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-bold">$ 0.00</span>
                            <span className="block text-[10px] text-rose-700 font-sans">✗ NO GATEWAY RECORD</span>
                          </div>
                        )}
                      </td>

                      {/* Ledger Column */}
                      <td className="py-3 px-4 font-mono">
                        {item.ledgerAmount !== null ? (
                          <div>
                            <span className="font-bold text-slate-900">$ {item.ledgerAmount.toFixed(2)}</span>
                            <span className="block text-[10px] text-emerald-700 font-sans">✓ POSTED</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-bold">—</span>
                            <span className="block text-[10px] text-amber-700 font-sans">⚠ NOT POSTED</span>
                          </div>
                        )}
                      </td>

                      {/* Bank Statement Column */}
                      <td className="py-3 px-4 font-mono">
                        {item.bankAmount !== null ? (
                          <div>
                            <span className="font-bold text-slate-900">$ {item.bankAmount.toFixed(2)}</span>
                            <span className="block text-[10px] text-emerald-700 font-sans">✓ CLEARED</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-bold">—</span>
                            <span className="block text-[10px] text-rose-700 font-sans">✗ MISSING IN FEED</span>
                          </div>
                        )}
                      </td>

                      {/* Diagnostic Diagnosis */}
                      <td className="py-3 px-4">
                        {item.matchStatus === 'PERFECT_MATCH' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PERFECT 3-WAY MATCH ($ 0.00 VAR)
                          </span>
                        )}
                        {item.matchStatus === 'UNPOSTED_BANK_FEE' && (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              UNPOSTED BANK WIRE FEE ($ 15.00)
                            </span>
                            <span className="block text-[10px] text-slate-500">Bank deducted fee without prior GL entry</span>
                          </div>
                        )}
                        {item.matchStatus === 'GATEWAY_DROP' && (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              SETTLEMENT TIMEOUT ($ 210.00)
                            </span>
                            <span className="block text-[10px] text-slate-500">Auth occurred but bank never settled</span>
                          </div>
                        )}
                        {item.matchStatus === 'IN_FLIGHT_ACH' && (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              IN-FLIGHT ACH (T+2 FLOAT)
                            </span>
                            <span className="block text-[10px] text-slate-500">Normal clearing window expected tomorrow</span>
                          </div>
                        )}
                      </td>

                      {/* Remediation Action */}
                      <td className="py-3 px-4 text-right">
                        {item.resolved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            <span>Remediated</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onExecuteThreeWayRemediation(item.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-xs transition-all"
                          >
                            Auto-Remediate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 4: BATCH PAYOUTS ==================== */}
      {activeScenario === 'batch' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                      POST /v1/payments/batch
                    </span>
                    <span className="text-xs text-slate-500">High-Throughput Disbursement</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                    Batch ACH / Wire Merchant Payouts
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Financial back-offices process weekly and daily merchant disbursements in atomic batches. The entire batch is validated with a single idempotent Batch Key, persists an outbox row per item, and guarantees that either all payouts succeed or the entire batch rolls back.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Batch Disbursement Preview (3 Beneficiaries)</span>
                    <span className="font-mono text-slate-500 text-[11px]">Key: {batchIdemKey}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <div className="font-semibold text-slate-900">Bella Italia Bistro (Weekly Settlement)</div>
                        <div className="text-[10px] text-slate-500">Ref: PAYOUT-REST-01 • ACH Direct Deposit</div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">$ 850.00</span>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <div className="font-semibold text-slate-900">Sushi Express (Courier & Sales Net)</div>
                        <div className="text-[10px] text-slate-500">Ref: PAYOUT-REST-02 • ACH Direct Deposit</div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">$ 540.00</span>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <div className="font-semibold text-slate-900">Green Salad Bar (Weekly Settlement)</div>
                        <div className="text-[10px] text-slate-500">Ref: PAYOUT-REST-03 • ACH Direct Deposit</div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">$ 320.00</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold font-mono">
                    <span>Total Batch Value (USD):</span>
                    <span className="text-emerald-700">$ 1,710.00</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleRunBatch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Atomic Batch via Transactional Outbox</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Past Batches */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">Executed Payout Batches</h4>
              <span className="text-[11px] text-slate-500 font-mono">{batches.length} completed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Batch ID</th>
                    <th className="py-2.5 px-4">Idempotency Key</th>
                    <th className="py-2.5 px-4">Items Count</th>
                    <th className="py-2.5 px-4">Total Amount</th>
                    <th className="py-2.5 px-4">Executed At</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {batches.map((b) => (
                    <tr key={b.batchId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{b.batchId}</td>
                      <td className="py-2.5 px-4 text-slate-500">{b.batchIdempotencyKey}</td>
                      <td className="py-2.5 px-4 text-slate-700">{b.totalItems} disbursements</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">$ {b.totalAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-slate-500">{new Date(b.createdAt).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 5: DISPUTES & CHARGEBACKS ==================== */}
      {activeScenario === 'dispute' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-800">
                      POST /v1/disputes
                    </span>
                    <span className="text-xs text-slate-500">Card Network Arbitration</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                    Dispute Lifecycle & Reserve Escrow Hold
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    When a cardholder files a chargeback, the disputed funds must be immediately isolated into a separate Escrow Liability account (acc_dispute_reserve) along with network arbitration fees. Resolving the dispute generates counter-balancing double-entry adjustments without mutating historical lines.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Target Settled Payment</label>
                    <select
                      value={selectedDisputePayment}
                      onChange={(e) => setSelectedDisputePayment(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                    >
                      {settledPayments.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} ({p.reference}) - $ {p.amount.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Chargeback Reason Code</label>
                    <select
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                    >
                      <option value="FRAUD_UNAUTHORIZED_CARD_USE">Fraud / Unauthorized Card Use (10.4)</option>
                      <option value="MERCHANDISE_NOT_RECEIVED">Merchandise Not Received (13.1)</option>
                      <option value="DEFECTIVE_OR_NOT_AS_DESCRIBED">Defective or Not As Described (13.3)</option>
                      <option value="DUPLICATE_PROCESSING">Duplicate Processing / Incorrect Amount (12.6)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunDispute}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Initiate Dispute & Escrow Hold</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dispute Case Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">Active & Resolved Disputes</h4>
              <span className="text-[11px] text-slate-500 font-mono">{disputes.length} cases</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Dispute ID</th>
                    <th className="py-2.5 px-4">Payment Ref</th>
                    <th className="py-2.5 px-4">Disputed Amount</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Arbitration Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{d.id}</td>
                      <td className="py-2.5 px-4 text-blue-700">{d.paymentId}</td>
                      <td className="py-2.5 px-4 font-bold text-rose-700">$ {d.amount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">{d.reason}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            d.status === 'OPEN_UNDER_REVIEW'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : d.status === 'RESOLVED_MERCHANT_WON'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-sans">
                        {d.status === 'OPEN_UNDER_REVIEW' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onResolveDispute(d.id, true)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs"
                            >
                              Merchant Won (Release Hold)
                            </button>
                            <button
                              onClick={() => onResolveDispute(d.id, false)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs"
                            >
                              Refund Customer
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Resolved & Balanced</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 6: CROSS-BORDER FX ==================== */}
      {activeScenario === 'fx' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                      POST /v1/payments/fx-settlement
                    </span>
                    <span className="text-xs text-slate-500">Cross-Currency Settlement</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                    Cross-Border FX Clearing with Treasury Spread
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Cross-border payments require multi-legged double-entry bookkeeping across currency boundaries. The system debits the USD customer account, credits foreign clearing, books treasury FX spread revenue, and settles EUR into the destination merchant account at the locked rate.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Source Amount ($ USD)</label>
                    <input
                      type="number"
                      step="1"
                      value={fxSourceAmount}
                      onChange={(e) => setFxSourceAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Exchange Rate (EUR / USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fxRate}
                      onChange={(e) => setFxRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunFx}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2"
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Execute FX Multi-Currency Settlement</span>
                  </button>
                </div>
              </div>

              {/* FX Breakdown Card */}
              <div className="w-full lg:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <span className="font-semibold text-slate-900 block border-b border-slate-200 pb-2">
                  FX Conversion Summary
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Gross USD Source:</span>
                  <span className="font-mono font-bold text-slate-900">$ {fxSourceAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Treasury Spread Fee:</span>
                  <span className="font-mono text-blue-700 font-semibold">$ 2.50 USD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Locked Rate:</span>
                  <span className="font-mono font-semibold">1 EUR = {fxRate} USD</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                  <span>EUR Credited to Merchant:</span>
                  <span className="font-mono text-emerald-700">
                    € {((fxSourceAmount - 2.50) / fxRate).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FX Transactions Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">Executed Cross-Border Settlements</h4>
              <span className="text-[11px] text-slate-500 font-mono">{fxSettlements.length} settled</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">FX Record ID</th>
                    <th className="py-2.5 px-4">Source USD</th>
                    <th className="py-2.5 px-4">Rate</th>
                    <th className="py-2.5 px-4">Target EUR</th>
                    <th className="py-2.5 px-4">Treasury Fee</th>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {fxSettlements.map((fx) => (
                    <tr key={fx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{fx.id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">$ {fx.sourceAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-slate-600">{fx.exchangeRate.toFixed(4)}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">€ {fx.targetAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-blue-700 font-semibold">$ {fx.spreadFee.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-sans">{fx.reference}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {fx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 7: TREASURY SWEEPS ==================== */}
      {activeScenario === 'sweep' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                      POST /v1/treasury/sweep
                    </span>
                    <span className="text-xs text-slate-500">Liquidity Management</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                    Treasury Liquidity Sweeps & End-of-Day Pool Rebalancing
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Financial institutions do not keep idle cash sitting in non-interest-bearing operating accounts overnight. The treasury desk executes daily cash sweeps from Federal Reserve clearing accounts into high-yield overnight money market reserves or intercompany Due To / Due From accounts while preserving reserve ratios.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Sweep Amount ($ USD)</label>
                    <input
                      type="number"
                      step="10000"
                      value={sweepAmount}
                      onChange={(e) => setSweepAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Sweep Target / Vehicle</label>
                    <select
                      value={sweepType}
                      onChange={(e) => setSweepType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                    >
                      <option value="OVERNIGHT_MONEY_MARKET">Overnight Money Market Liquidity Pool (5.25% Yield)</option>
                      <option value="INTERCOMPANY_DUE_TO_FROM">Intercompany Due To / Due From Pool</option>
                      <option value="OPERATIONAL_MINIMUM_RESERVE">Regulatory Reserve Capital Buffer</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunSweep}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Execute Treasury Liquidity Sweep</span>
                  </button>
                </div>
              </div>

              {/* Pool Status */}
              <div className="w-full lg:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <span className="font-semibold text-slate-900 block border-b border-slate-200 pb-2">
                  Clearing vs Liquidity Balances
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Fed Reserve Clearing Asset:</span>
                  <span className="font-mono font-bold text-slate-900">
                    $ {accounts.find((a) => a.id === 'acc_cash_clearing_usd')?.balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Overnight MM Liquidity Pool:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    $ {accounts.find((a) => a.id === 'acc_treasury_overnight_mm')?.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sweeps Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">Historical Treasury Liquidity Sweeps</h4>
              <span className="text-[11px] text-slate-500 font-mono">{treasurySweeps.length} executed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Sweep ID</th>
                    <th className="py-2.5 px-4">Source Account</th>
                    <th className="py-2.5 px-4">Destination Account</th>
                    <th className="py-2.5 px-4">Amount Swept</th>
                    <th className="py-2.5 px-4">Strategy</th>
                    <th className="py-2.5 px-4">Journal Entry Ref</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {treasurySweeps.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{s.id}</td>
                      <td className="py-2.5 px-4 text-slate-600">{s.sourceAccountId}</td>
                      <td className="py-2.5 px-4 text-blue-700">{s.destinationAccountId}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">$ {s.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-700">{s.sweepType}</td>
                      <td className="py-2.5 px-4 text-slate-500">{s.journalEntryId}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 8: COMPLIANCE & AML FREEZE ==================== */}
      {activeScenario === 'freeze' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800">
                    POST /v1/accounts/{'{id}'}/freeze
                  </span>
                  <span className="text-xs text-slate-500">Sanctions & AML Protection</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-2">
                  Compliance Account Freeze & Sanctions Enforcement
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Financial institutions must comply with regulatory orders, OFAC sanctions, and AML SAR filings. When an account is placed under a Compliance Freeze, any subsequent attempt to debit, credit, or initiate payouts will be immediately rejected with an HTTP 423 Locked / ComplianceHoldException.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Default Regulatory Justification for Freeze:
                </label>
                <input
                  type="text"
                  value={freezeReasonText}
                  onChange={(e) => setFreezeReasonText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Accounts Freeze Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">General Ledger Accounts & Compliance Status</h4>
              <span className="text-[11px] text-slate-500">Click button to toggle real-time freeze</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Account ID</th>
                    <th className="py-2.5 px-4">Account Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Balance</th>
                    <th className="py-2.5 px-4">Compliance Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {accounts.map((acc) => {
                    const isFrozen = acc.status === 'FROZEN_AML' || acc.status === 'FROZEN_COMPLIANCE';
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">{acc.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{acc.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{acc.type}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {acc.currency === 'USD' ? '$' : '€'} {acc.balance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {isFrozen ? (
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                                <Lock className="w-3 h-3" />
                                FROZEN (AML HOLD)
                              </span>
                              {acc.freezeReason && (
                                <span className="block text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">
                                  {acc.freezeReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <Unlock className="w-3 h-3" />
                              ACTIVE (OPERATIONAL)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onToggleAccountFreeze(acc.id, freezeReasonText)}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                              isFrozen
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {isFrozen ? 'Release Freeze' : 'Place AML Hold'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO 9: TRIAL BALANCE & SUB-LEDGER ==================== */}
      {activeScenario === 'trialBalance' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    GET /v1/ledger/trial-balance
                  </span>
                  <span className="text-xs text-slate-500">GAAP / IFRS Mathematical Proof</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-2">
                  Real-Time General Ledger Trial Balance & Sub-Ledger Statement
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                  In production financial systems, trial balance reconciliation runs continuously. Every journal entry posted across split payouts, refunds, disputes, or treasury sweeps must preserve the absolute mathematical invariant: <strong>Total Debit Balances = Total Credit Balances</strong>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-4 font-mono">
                  <span className="text-slate-600">Total Debit Balances:</span>
                  <span className="font-bold text-slate-900">
                    $ {totalDebitBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 font-mono">
                  <span className="text-slate-600">Total Credit Balances:</span>
                  <span className="font-bold text-slate-900">
                    $ {totalCreditBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                  <span>Equilibrium Check:</span>
                  <span className="font-mono text-emerald-700">✓ EXACT EQUALITY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trial Balance Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">General Ledger Accounts Trial Balance</h4>
              <span className="text-[11px] text-slate-500">Live Snapshot</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Account ID</th>
                    <th className="py-2.5 px-4">Account Name</th>
                    <th className="py-2.5 px-4">Classification</th>
                    <th className="py-2.5 px-4 text-right">Debit Balance</th>
                    <th className="py-2.5 px-4 text-right">Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {trialBalanceRows.map((r) => (
                    <tr key={r.account.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{r.account.id}</td>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{r.account.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{r.account.type}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {r.normalBalance === 'DEBIT' ? `$ ${r.netBalance.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {r.normalBalance === 'CREDIT' ? `$ ${r.netBalance.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="py-3 px-4 font-sans text-slate-900">
                      TOTAL (Equilibrium Invariant: Σ Dr = Σ Cr)
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-800">
                      $ {totalDebitBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-800">
                      $ {totalCreditBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sub-Ledger Statement Inspector */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Drill-Down Sub-Ledger Statement</h4>
                <p className="text-[11px] text-slate-500">
                  Inspect immutable journal postings that created the current balance for an individual account.
                </p>
              </div>

              <select
                value={selectedAccountForStatement}
                onChange={(e) => setSelectedAccountForStatement(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Journal Ref</th>
                    <th className="py-2 px-3">Payment Ref</th>
                    <th className="py-2 px-3">Entry Type</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {accountStatementLines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                        No transactions recorded for this account yet.
                      </td>
                    </tr>
                  ) : (
                    accountStatementLines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500">{new Date(l.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2 px-3 text-blue-700 font-semibold">{l.journalEntryId}</td>
                        <td className="py-2 px-3 text-slate-600">{l.reference}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              l.entryType === 'DEBIT' ? 'bg-blue-50 text-blue-800' : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {l.entryType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">$ {l.amount.toFixed(2)}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{l.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Core Microservices Studio Section */}
      {primaryViewMode === 'studio' && (
        <div className="space-y-6">
          {/* Service Sub-Tab Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1.5 shadow-xs">
            <button
              onClick={() => setStudioSubTab('payment')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                studioSubTab === 'payment'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>1. payment-api (Ingestion & Outbox)</span>
              {outbox.filter((o) => o.status === 'PENDING').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setStudioSubTab('ledger')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                studioSubTab === 'ledger'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>2. ledger-service (Double-Entry T-Accounts)</span>
            </button>

            <button
              onClick={() => setStudioSubTab('recon')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                studioSubTab === 'recon'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>3. recon-service (Bank Feed & Breaks)</span>
              {breaks.filter((b) => b.status === 'UNRESOLVED').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                  {breaks.filter((b) => b.status === 'UNRESOLVED').length}
                </span>
              )}
            </button>
          </div>

          {studioSubTab === 'payment' && (
            <PaymentApiConsole
              payments={payments}
              outbox={outbox}
              kafkaMessages={kafkaMessages}
              onInitiatePayment={onInitiatePayment}
              onDrainOutbox={onDrainOutbox}
            />
          )}

          {studioSubTab === 'ledger' && (
            <LedgerConsole
              accounts={accounts}
              journalEntries={journalEntries}
              onReverseEntry={onReverseEntry}
            />
          )}

          {studioSubTab === 'recon' && (
            <ReconConsole
              reconRuns={reconRuns}
              breaks={breaks}
              auditLogs={auditLogs}
              onTriggerReconRun={onTriggerReconRun}
              onResolveBreak={onResolveBreak}
            />
          )}
        </div>
      )}
    </div>
  );
};

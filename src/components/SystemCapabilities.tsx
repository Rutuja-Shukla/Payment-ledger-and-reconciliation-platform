import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Database,
  Layers,
  ArrowRightLeft,
  Lock,
  FileSpreadsheet,
  Activity,
  Sparkles,
  Split,
  RotateCcw,
  Landmark,
  Send,
  ShieldAlert,
  Globe2,
  Clock,
  Code2,
  Cpu,
  Server,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const SystemCapabilities: React.FC = () => {
  const [selectedApiFilter, setSelectedApiFilter] = useState<string>('ALL');

  const architecturalPillars = [
    {
      title: 'Zero Data Loss (Transactional Outbox)',
      badge: 'Data Integrity',
      icon: Database,
      description:
        'Guarantees that business state and event streaming remain strictly consistent by executing payment ingestion and outbox event insertion in a single PostgreSQL ACID transaction. Completely eliminates dual-write vulnerabilities and distributed 2PC locks.',
      metric: '100% Ingestion Durability',
    },
    {
      title: 'Mathematical Double-Entry Invariant',
      badge: 'Accounting Standard',
      icon: ShieldCheck,
      description:
        'Enforces the foundational banking equation: sum(Debits) == sum(Credits) for every posted journal entry. Operates on WORM (Write Once, Read Many) principles with zero in-place mutations; reversals are posted as counterbalancing entries.',
      metric: 'Δ = 0.00 Tolerance',
    },
    {
      title: 'Deterministic Idempotency (RFC-7231)',
      badge: 'Duplicate Protection',
      icon: Lock,
      description:
        'Protects against network retries and duplicate submissions using SHA-256 cryptographic payload fingerprinting backed by Redis with persistent PostgreSQL fallback. Replaying identical keys yields cached responses; payload mutations yield HTTP 409 Conflict.',
      metric: 'Sub-50ms Cache Hit',
    },
    {
      title: 'Deterministic Concurrency Control',
      badge: 'Race Prevention',
      icon: ArrowRightLeft,
      description:
        'Employs PostgreSQL SELECT ... FOR UPDATE (pessimistic row locking) on account balances. Serializes concurrent payment attempts on shared or hot accounts, completely eliminating negative balances and overdraft storms.',
      metric: 'Zero Overdraft Risk',
    },
    {
      title: 'Marketplace Split Settlement Engine',
      badge: 'Commerce Clearing',
      icon: Split,
      description:
        'Deconstructs gross transactions into 4 balanced legs: card network interchange, platform take-rate revenue, rolling reserve escrow (for chargeback risk mitigation), and net merchant payout in a single atomic posting.',
      metric: '4-Leg Atomic Allocation',
    },
    {
      title: 'Prorated Refund Engine with Over-Refund Guard',
      badge: 'Refund Governance',
      icon: RotateCcw,
      description:
        'Supports multiple partial refunds per transaction while enforcing an exact ceiling against remaining unrefunded principal. Proportionately claws back merchant payout, platform fee revenue, and rolling reserves.',
      metric: '0.00 Over-Refund Leakage',
    },
    {
      title: 'Multi-Source 3-Way Reconciliation',
      badge: 'Recon Matrix',
      icon: FileSpreadsheet,
      description:
        'Performs simultaneous 3-way matching across Internal Ledger Records, External Gateway Processor Feeds, and Bank Clearing Statements. Automatically resolves fee-rounding variances within configurable tolerance thresholds ($0.05).',
      metric: 'Automated Break Classification',
    },
    {
      title: 'Bulk ACH / Wire Batch Payout Processor',
      badge: 'Mass Disbursement',
      icon: Send,
      description:
        'Batches multiple vendor or creator disbursements into a unified settlement run with a dedicated batch idempotency key. Debits bulk operating capital and distributes funds across individual beneficiary bank accounts.',
      metric: 'High-Throughput Batching',
    },
    {
      title: 'Dispute & Chargeback Escrow Lifecycle',
      badge: 'Risk Mitigation',
      icon: ShieldAlert,
      description:
        'Automates the merchant dispute lifecycle. Immediately ring-fences disputed funds into a segregated dispute escrow account upon notice. Releases funds or executes permanent clawbacks upon network evidence arbitration.',
      metric: 'Automated Ring-Fencing',
    },
    {
      title: 'Cross-Border Multi-Currency FX Clearing',
      badge: 'Foreign Exchange',
      icon: Globe2,
      description:
        'Processes cross-border currency conversions with locked real-time exchange rates. Records foreign currency debits, target currency payouts, and automated FX spread/margin revenue across isolated currency sub-ledgers.',
      metric: 'Multi-Currency Sub-Ledgers',
    },
    {
      title: 'Treasury Liquidity Sweeps & Concentration',
      badge: 'Cash Management',
      icon: Landmark,
      description:
        'Executes automated overnight money-market sweeps, intercompany due-to/due-from transfers, and operating reserve rebalancing. Maximizes cash yield while maintaining mandatory liquidity buffers.',
      metric: 'Automated Yield Sweeps',
    },
    {
      title: 'AML & Compliance Freeze Enforcement',
      badge: 'Regulatory Hold',
      icon: Lock,
      description:
        'Enforces FinCEN Section 314(b) compliance holds on accounts exhibiting suspicious structuring. The double-entry engine immediately rejects all incoming debits or credits with HTTP 423 Locked / ComplianceHoldException.',
      metric: 'Sub-millisecond Lockout',
    },
  ];

  const apiFunctionalityCatalog = [
    {
      method: 'POST',
      endpoint: '/v1/payments',
      category: 'PAYMENTS',
      title: 'Payment Ingestion & Outbox Relay',
      description: 'Ingests credit card, ACH, or SEPA payments with client-supplied Idempotency-Key. Writes payment entity and outbox message in a single local DB transaction.',
      guarantee: 'Zero Data Loss, At-Least-Once Kafka Delivery',
      ledgerImpact: 'Dr: Cash/Gateway Settlement Clearing, Cr: Merchant Payable',
    },
    {
      method: 'POST',
      endpoint: '/v1/payments/split-settlement',
      category: 'COMMERCE',
      title: 'Marketplace Split Settlement & Take-Rate',
      description: 'Decomposes gross marketplace payments into interchange network fees, platform SaaS take-rate, rolling reserve escrow, and net merchant disbursement.',
      guarantee: 'Mathematical Balance (ΣDr = ΣCr), No Negative Merchant Balances',
      ledgerImpact: 'Dr: Customer Deposits, Cr: Merchant Operating, Cr: Interchange Expense, Cr: Platform Revenue, Cr: Rolling Reserve',
    },
    {
      method: 'POST',
      endpoint: '/v1/payments/{id}/refund',
      category: 'PAYMENTS',
      title: 'Partial & Prorated Refund Engine',
      description: 'Executes partial or full refunds against settled payments. Enforces strict over-refund guard and claws back proportional platform take-rate and rolling reserves.',
      guarantee: 'Accumulated Refunds <= Original Payment Amount',
      ledgerImpact: 'Dr: Merchant Operating, Dr: Platform Revenue, Dr: Rolling Reserve, Cr: Customer Deposits',
    },
    {
      method: 'POST',
      endpoint: '/v1/batches',
      category: 'PAYMENTS',
      title: 'Bulk ACH / Wire Batch Payout Processor',
      description: 'Processes mass disbursements to multiple suppliers or creators. Groups items under a single batch idempotency key with itemized transaction tracing.',
      guarantee: 'Deterministic Batch Idempotency, Atomic Balance Availability Check',
      ledgerImpact: 'Dr: Operating Cash Account, Cr: Multiple Vendor Settlement Accounts',
    },
    {
      method: 'POST',
      endpoint: '/v1/disputes',
      category: 'RISK',
      title: 'Dispute & Chargeback Initiation',
      description: 'Initiated upon receiving a card network (Visa/Mastercard) chargeback notification. Immediately isolates disputed funds into segregated dispute escrow.',
      guarantee: 'Immediate Funds Ring-Fencing, Real-Time Merchant Notification',
      ledgerImpact: 'Dr: Merchant Operating Account, Cr: Dispute Escrow Liability',
    },
    {
      method: 'POST',
      endpoint: '/v1/disputes/{id}/resolve',
      category: 'RISK',
      title: 'Dispute Arbitration Resolution',
      description: 'Resolves disputed funds following merchant evidence evaluation. If merchant wins, funds return to merchant; if lost, funds disburse to customer.',
      guarantee: 'Audit-Logged Dispute Resolution with Network Reference',
      ledgerImpact: 'Merchant Won: Dr: Dispute Escrow, Cr: Merchant Operating | Merchant Lost: Dr: Dispute Escrow, Cr: Customer Refund',
    },
    {
      method: 'POST',
      endpoint: '/v1/payments/fx-settlement',
      category: 'TREASURY',
      title: 'Cross-Border Multi-Currency FX Clearing',
      description: 'Clears cross-currency transactions across disparate currency ledgers (e.g., EUR to USD). Applies fixed conversion rate and captures spread fee.',
      guarantee: 'Currency-Isolated Sub-Ledger Balanced Postings',
      ledgerImpact: 'Dr: Source Currency Account (EUR), Cr: FX Intermediary (EUR); Dr: FX Intermediary (USD), Cr: Destination Account (USD), Cr: FX Revenue (USD)',
    },
    {
      method: 'POST',
      endpoint: '/v1/treasury/sweep',
      category: 'TREASURY',
      title: 'Treasury Cash Sweeps & Yield Optimization',
      description: 'Sweeps excess liquidity from commercial operating accounts into interest-bearing money-market funds or intercompany concentration pools.',
      guarantee: 'Preserves Minimum Operating Float, Prevents Over-Sweep',
      ledgerImpact: 'Dr: Money Market / Yield Pool Asset, Cr: Commercial Operating Cash',
    },
    {
      method: 'POST',
      endpoint: '/v1/accounts/{id}/freeze',
      category: 'COMPLIANCE',
      title: 'AML & Compliance Account Freeze',
      description: 'Applies regulatory or AML freezes under FinCEN Section 314(b). Prohibits any subsequent debit or credit posting with HTTP 423 Locked.',
      guarantee: 'Immediate Deterministic Rejection of All Future Transactions',
      ledgerImpact: 'No New Postings Permitted; Audit Log Appended',
    },
    {
      method: 'POST',
      endpoint: '/v1/recon/three-way-match',
      category: 'RECON',
      title: '3-Way Reconciliation & Break Remediation',
      description: 'Triangulates Internal Ledger entries with Payment Gateway logs and Bank Statement feeds. Automatically flags discrepancies and resolves tolerance variances.',
      guarantee: 'Zero Unaccounted Variance, Automated Audit Trail',
      ledgerImpact: 'Auto-Remediation: Posts adjusting balancing journal entry for authorized variances',
    },
    {
      method: 'POST',
      endpoint: '/v1/recon/rules',
      category: 'RECON',
      title: 'Automated Bank Tolerance Matching Rules',
      description: 'Configures rules for automated reconciliation tolerance (e.g., $0.05 interchange rounding tolerance, 24h bank settlement time window).',
      guarantee: 'Deterministic Rule Evaluation without Human Intervention',
      ledgerImpact: 'Automated Resolution Journal Entry Posted',
    },
    {
      method: 'POST',
      endpoint: '/v1/ledger/entries/{id}/reverse',
      category: 'LEDGER',
      title: 'Immutable Ledger Entry Reversal',
      description: 'Posts a counterbalancing journal entry that mirrors the original debits and credits in reverse. Completely preserves historical audit logs without updating past rows.',
      guarantee: 'Zero Schema UPDATEs/DELETEs; Full WORM Immutability',
      ledgerImpact: 'Counterbalancing Entry (Original Debits credited, Original Credits debited)',
    },
  ];

  const architecturalAdvantages = [
    {
      title: 'Elimination of Two-Phase Commit (2PC) Bottlenecks',
      points: [
        'Traditional distributed transactions (XA / 2PC) lock database resources across network hops, creating fragile availability bottlenecks.',
        'The Transactional Outbox pattern achieves strict consistency by leveraging standard local PostgreSQL ACID transactions.',
        'Downstream microservices consume events asynchronously via Apache Kafka without blocking user-facing checkout response latency.',
      ],
    },
    {
      title: 'Auditable & Regulatory-Compliant Immutability (WORM)',
      points: [
        'Direct UPDATE or DELETE operations on ledger lines are forbidden at the database schema and application layer.',
        'All corrections post explicit counterbalancing journal entries, preserving complete forensic audit trails for bank regulators.',
        'Manual reconciliation break resolutions require mandatory justification notes recorded in an append-only compliance audit log.',
      ],
    },
    {
      title: 'Decoupled Burst Ingestion & Downstream Resilience',
      points: [
        'If Apache Kafka or downstream ledger consumers experience temporary outages or rebalances, payment ingestion continues uninterrupted.',
        'PostgreSQL outbox records act as an on-disk durable queue that automatically drains upon broker reconnection.',
        'Dead-Letter Topics (DLT) isolate unparseable payloads without stalling overall partition processing.',
      ],
    },
    {
      title: 'Strict Concurrency Isolation under High Load',
      points: [
        'Optimistic locking (@Version) under high write contention on merchant accounts causes severe retry storms and transaction rollbacks.',
        'Pessimistic write locking (SELECT ... FOR UPDATE) provides deterministic FIFO queueing at the database level, ensuring reliable balance validation.',
        'Account lock ordering protocols prevent distributed deadlocks during multi-account postings.',
      ],
    },
  ];

  const filteredApis =
    selectedApiFilter === 'ALL'
      ? apiFunctionalityCatalog
      : apiFunctionalityCatalog.filter((a) => a.category === selectedApiFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                Payment ledger and reconciliation platform Capabilities
              </span>
              <span className="text-xs text-slate-500 font-medium">Enterprise Distributed Financial Core</span>
            </div>
            <h2 className="text-xl font-bold mt-2 text-slate-900">
              Core Features & Architectural Advantages
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-4xl leading-relaxed">
              Payment ledger and reconciliation platform is an enterprise-grade financial infrastructure application and distributed systems blueprint designed for mission-critical payment workflows. It solves the hardest challenges in modern fintech—eliminating dual-write state divergence, preventing concurrent double-spending, maintaining immutable balanced books (&sum; Debits &equiv; &sum; Credits), and automating multi-source 3-way settlement reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium">
              12 Core Capabilities
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-medium">
              12 REST APIs
            </div>
          </div>
        </div>
      </div>

      {/* 12 Core Architectural Capabilities Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            12 Architectural Pillars & Financial Capabilities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {architecturalPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {pillar.badge}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1.5">{pillar.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{pillar.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Design Guarantee:</span>
                  <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px]">
                    {pillar.metric}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* React 18 Frontend Architecture & Developer Ergonomics Highlight */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                React 18 Enterprise Operational Control Plane
              </h3>
              <p className="text-xs text-slate-500">
                High-performance client-side simulation engine, real-time balance checker, and back-office workbench.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded font-semibold">
              React 18.3
            </span>
            <span className="bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded font-semibold">
              Vite 5.4
            </span>
            <span className="bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded font-semibold">
              Modern Design Tokens
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/80 p-3.5 rounded-lg border border-blue-100 shadow-2xs">
            <span className="font-bold text-slate-900 block mb-1">Client Invariant Engine</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Real-time arithmetic auditor that computes ΣDebits == ΣCredits across all ledger accounts on every state change, alerting operators within 1ms if an imbalance occurs.
            </p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-lg border border-blue-100 shadow-2xs">
            <span className="font-bold text-slate-900 block mb-1">Zero-Latency Simulations</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Provides instant feedback loops for complex financial workflows (split disbursements, refunds, 3-way reconciliation) before committing updates across microservices.
            </p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-lg border border-blue-100 shadow-2xs">
            <span className="font-bold text-slate-900 block mb-1">Strict Domain Modeling</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Fully validated financial domain models covering Double-Entry Journal Lines, Split Settlements, FX Records, Reconciliation Breaks, and AML hold statuses.
            </p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-lg border border-blue-100 shadow-2xs">
            <span className="font-bold text-slate-900 block mb-1">Enterprise Design Discipline</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Production light-mode aesthetic inspired by Stripe and Modern Treasury, featuring high-density data tables, monospaced ledger references, and status badges.
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive API Endpoints Catalog */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Comprehensive Financial API Endpoints Catalog
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive specification of all endpoints powering payments, refunds, reconciliation, FX, and treasury.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {['ALL', 'PAYMENTS', 'COMMERCE', 'RISK', 'TREASURY', 'RECON', 'COMPLIANCE', 'LEDGER'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedApiFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedApiFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Method & Route</th>
                <th className="py-2.5 px-3">Feature & Purpose</th>
                <th className="py-2.5 px-3">Architectural Guarantee</th>
                <th className="py-2.5 px-3">Double-Entry Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApis.map((api, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {api.method}
                      </span>
                      <span className="font-mono font-semibold text-slate-900">{api.endpoint}</span>
                    </div>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {api.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top max-w-xs">
                    <span className="font-bold text-slate-900 block mb-0.5">{api.title}</span>
                    <span className="text-slate-600 text-[11px] leading-relaxed block">{api.description}</span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{api.guarantee}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top max-w-xs">
                    <span className="font-mono text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 block leading-normal">
                      {api.ledgerImpact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architectural Advantages & System Design Decisions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Key Architectural Advantages & Trade-Off Decisions
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Technical rationale behind core engineering decisions and system trade-offs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {architecturalAdvantages.map((adv, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adv.title}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {adv.points.map((pt, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-1.5 leading-relaxed text-[11px]">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Microservice Boundaries Summary */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-blue-400 mb-3">
          <Layers className="w-4 h-4" />
          <h3 className="text-xs font-bold tracking-wide uppercase font-mono">
            Distributed Service Boundaries & Polyglot Stack
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-blue-400 font-bold block mb-1">react-control-plane</span>
            <span className="text-slate-300 font-sans block mb-2 text-[11px]">
              React 18 + Vite client operations console, simulation engine, and real-time trial balance auditor.
            </span>
            <span className="text-[10px] text-slate-400">Runtime: Browser / Vite HMR</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-emerald-400 font-bold block mb-1">payment-api</span>
            <span className="text-slate-300 font-sans block mb-2 text-[11px]">
              Ingests payments, generates RFC idempotency hashes, and persists Transactional Outbox rows.
            </span>
            <span className="text-[10px] text-slate-400">Database: payment_db (PostgreSQL)</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-teal-400 font-bold block mb-1">ledger-service</span>
            <span className="text-slate-300 font-sans block mb-2 text-[11px]">
              Consumes Kafka events, enforces ΣDr = ΣCr double-entry invariant, and locks account balances.
            </span>
            <span className="text-[10px] text-slate-400">Database: ledger_db (PostgreSQL)</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-cyan-400 font-bold block mb-1">recon-service</span>
            <span className="text-slate-300 font-sans block mb-2 text-[11px]">
              Normalizes bank statement feeds, executes 3-way matching matrix, and logs compliance resolutions.
            </span>
            <span className="text-[10px] text-slate-400">Database: recon_db (PostgreSQL)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

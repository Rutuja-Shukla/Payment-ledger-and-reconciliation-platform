import React, { useState } from 'react';
import { PaymentRecord, OutboxRecord, KafkaMessage } from '../types';
import { Send, RefreshCw, AlertCircle, CheckCircle2, Lock, Copy, Check } from 'lucide-react';

interface PaymentApiConsoleProps {
  payments: PaymentRecord[];
  outbox: OutboxRecord[];
  kafkaMessages: KafkaMessage[];
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
}

export const PaymentApiConsole: React.FC<PaymentApiConsoleProps> = ({
  payments,
  outbox,
  onInitiatePayment,
  onDrainOutbox,
}) => {
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => 'idem-' + Math.random().toString(36).substring(2, 10));
  const [sourceAccount, setSourceAccount] = useState<string>('acc_cust_101');
  const [destAccount, setDestAccount] = useState<string>('acc_merch_202');
  const [amount, setAmount] = useState<number>(149.50);
  const [currency] = useState<string>('USD');
  const [reference, setReference] = useState<string>('INV-2026-003');

  const [lastResponse, setLastResponse] = useState<{
    status: number;
    headers: Record<string, string>;
    body: any;
    scenarioNote?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleGenerateNewKey = () => {
    setIdempotencyKey('idem-' + Math.random().toString(36).substring(2, 10));
  };

  const handleSendPayment = () => {
    const result = onInitiatePayment({
      idempotencyKey,
      sourceAccountId: sourceAccount,
      destinationAccountId: destAccount,
      amount: Number(amount),
      currency,
      paymentMethod: 'CREDIT_CARD',
      reference,
    });

    setLastResponse({
      status: result.status,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'X-Trace-Parent': '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      },
      body: result.body,
      scenarioNote: result.status === 201
        ? 'Payment accepted. Atomic DB transaction committed payment record and PENDING outbox row.'
        : result.status === 200
        ? 'Idempotency Cache HIT: Replayed identical key + payload. Returned cached response.'
        : 'Idempotency Conflict (409): Key was previously used with a different payload or amount.',
    });
  };

  const handleReplayIdentical = () => {
    handleSendPayment();
  };

  const handleReplayConflict = () => {
    const modifiedAmount = Number((amount + 0.50).toFixed(2));
    setAmount(modifiedAmount);
    const result = onInitiatePayment({
      idempotencyKey,
      sourceAccountId: sourceAccount,
      destinationAccountId: destAccount,
      amount: modifiedAmount,
      currency,
      paymentMethod: 'CREDIT_CARD',
      reference,
    });

    setLastResponse({
      status: result.status,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: result.body,
      scenarioNote: 'HTTP 409 Conflict: Same Idempotency-Key supplied with differing payload hash.',
    });
  };

  const copyResponse = () => {
    if (!lastResponse) return;
    navigator.clipboard.writeText(JSON.stringify(lastResponse.body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingCount = outbox.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Service 1: payment-api
            </span>
            <span className="text-xs text-slate-500 font-medium">Transactional Ingestion & Deduplication</span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-slate-900">Payment Ingestion & Outbox Console</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Atomically commits payment and outbox records in a single PostgreSQL ACID transaction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDrainOutbox}
            disabled={pendingCount === 0}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              pendingCount > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Drain Outbox Relay ({pendingCount} pending)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Initiate Payment Transaction
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Idempotency Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-medium">Header: Idempotency-Key</label>
                <button
                  onClick={handleGenerateNewKey}
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-medium"
                >
                  Generate New UUID
                </button>
              </div>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>

            {/* Source & Destination Account */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Source Account</label>
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="acc_cust_101">acc_cust_101 (Cust John)</option>
                  <option value="acc_cash_clearing_usd">acc_cash_clearing_usd</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 font-medium block mb-1">Destination Account</label>
                <select
                  value={destAccount}
                  onChange={(e) => setDestAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="acc_merch_202">acc_merch_202 (Acme Store)</option>
                  <option value="acc_clearing_fee_expense">acc_clearing_fee_expense</option>
                </select>
              </div>
            </div>

            {/* Amount & Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-slate-700 font-medium block mb-1">Invoice Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleSendPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Execute POST /v1/payments</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleReplayIdentical}
                  className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  <span>Replay (Cache Hit)</span>
                </button>
                <button
                  onClick={handleReplayConflict}
                  className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  <span>Replay Conflict (409)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* HTTP Inspector Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">HTTP Response Inspector</span>
                {lastResponse && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      lastResponse.status === 201
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : lastResponse.status === 200
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    HTTP {lastResponse.status}
                  </span>
                )}
              </div>
              {lastResponse && (
                <button
                  onClick={copyResponse}
                  className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            {lastResponse ? (
              <div className="space-y-3">
                {lastResponse.scenarioNote && (
                  <div
                    className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
                      lastResponse.status === 409
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    {lastResponse.status === 409 ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <span>{lastResponse.scenarioNote}</span>
                  </div>
                )}

                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto max-h-56 scrollbar-thin">
                  <pre className="text-emerald-400">
                    {JSON.stringify(lastResponse.body, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Submit a payment transaction to inspect the returned HTTP status code, response headers, and JSON body.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Database Guarantee: Single ACID boundary</span>
            <span className="text-emerald-700 font-medium">Zero Dual-Write Vulnerability</span>
          </div>
        </div>
      </div>

      {/* Database State Tables: payments & payment_outbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              PostgreSQL: payments Table
            </h3>
            <span className="text-xs text-slate-500 font-mono">{payments.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Amount</th>
                  <th className="py-2 px-2.5">Source &rarr; Dest</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-2.5 text-blue-700 font-medium truncate max-w-[120px]">{p.id}</td>
                    <td className="py-2 px-2.5 text-slate-900 font-bold">${p.amount.toFixed(2)}</td>
                    <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                      {p.sourceAccountId.replace('acc_', '')} &rarr; {p.destinationAccountId.replace('acc_', '')}
                    </td>
                    <td className="py-2 px-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outbox Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              PostgreSQL: payment_outbox Table
            </h3>
            <span className="text-xs text-slate-500 font-mono">{outbox.length} entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5">Outbox ID</th>
                  <th className="py-2 px-2.5">Payment ID</th>
                  <th className="py-2 px-2.5">Relay Status</th>
                  <th className="py-2 px-2.5">Retries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outbox.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-2.5 text-amber-700 font-medium truncate max-w-[110px]">{o.id}</td>
                    <td className="py-2 px-2.5 text-slate-700 truncate max-w-[120px]">{o.aggregateId}</td>
                    <td className="py-2 px-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'PUBLISHED'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-500">{o.retryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

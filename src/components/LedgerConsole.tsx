import React, { useState } from 'react';
import { AccountRecord, JournalEntryRecord } from '../types';
import { ShieldCheck, ArrowRightLeft, BookOpen, AlertTriangle, RefreshCcw, Lock } from 'lucide-react';

interface LedgerConsoleProps {
  accounts: AccountRecord[];
  journalEntries: JournalEntryRecord[];
  onReverseEntry: (journalId: string, justification: string) => void;
}

export const LedgerConsole: React.FC<LedgerConsoleProps> = ({
  accounts,
  journalEntries,
  onReverseEntry,
}) => {
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [justification, setJustification] = useState<string>('Erroneous chargeback requested by card network');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Compute total debits and credits across all ledger lines
  let totalDebits = 0;
  let totalCredits = 0;
  journalEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      if (line.entryType === 'DEBIT') totalDebits += line.amount;
      if (line.entryType === 'CREDIT') totalCredits += line.amount;
    });
  });

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001;

  const handleOpenReverseModal = (journalId: string) => {
    setSelectedJournal(journalId);
    setIsModalOpen(true);
  };

  const handleConfirmReversal = () => {
    if (selectedJournal && justification.trim()) {
      onReverseEntry(selectedJournal, justification);
      setIsModalOpen(false);
      setSelectedJournal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Service 2: ledger-service
            </span>
            <span className="text-xs text-slate-500 font-medium">Immutable Double-Entry Ledger Engine</span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-slate-900">Double-Entry Ledger Console</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Strict mathematical invariance: Every transaction&apos;s debits equal its credits. Zero in-place edits.
          </p>
        </div>

        {/* Real-Time Mathematical Invariant Badge */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">Accounting Invariant</div>
            <div className="text-xs font-bold text-slate-900">
              Debits: <span className="font-mono text-emerald-700">${totalDebits.toFixed(2)}</span> | Credits: <span className="font-mono text-blue-700">${totalCredits.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isBalanced ? 'Balanced (Δ = 0.00)' : 'UNBALANCED'}</span>
          </div>
        </div>
      </div>

      {/* T-Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-slate-500 text-[11px] truncate max-w-[140px] font-medium">{acc.id}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {acc.type}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate">{acc.name}</h4>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">Balance:</span>
              <span className="text-base font-mono font-bold text-slate-900">
                ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Version: v{acc.version}</span>
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> PESSIMISTIC_WRITE
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Journal Entries Feed */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              Immutable Journal Entries & Ledger Lines
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Entries are Write-Once-Read-Many (WORM). To correct an error, a Reversing Entry is posted.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{journalEntries.length} entries recorded</span>
        </div>

        <div className="space-y-3">
          {journalEntries.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-xl border transition-all ${
                entry.status === 'REVERSED'
                  ? 'bg-slate-50 border-slate-200 opacity-70'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{entry.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      entry.status === 'POSTED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {entry.status}
                  </span>
                  {entry.reversalOfId && (
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Reversal of {entry.reversalOfId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span>Ref: {entry.paymentId}</span>
                  <span>•</span>
                  <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
                  {entry.status === 'POSTED' && (
                    <button
                      onClick={() => handleOpenReverseModal(entry.id)}
                      className="ml-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-sans font-medium"
                    >
                      <RefreshCcw className="w-3 h-3 text-slate-600" />
                      <span>Reverse Entry</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ledger Lines Table (Debits & Credits) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                {entry.lines.map((line) => (
                  <div
                    key={line.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      line.entryType === 'DEBIT'
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-blue-50/50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div>
                      <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded mr-2 bg-white border border-slate-200">
                        {line.entryType}
                      </span>
                      <span className="text-slate-800 font-medium">{line.accountId}</span>
                    </div>
                    <span className="font-bold text-sm">
                      {line.entryType === 'DEBIT' ? '+' : '-'}${line.amount.toFixed(2)} {line.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Post Reversing Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg w-full text-slate-900 shadow-xl">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">Post Counter-Balancing Reversing Entry</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Financial ledger entries cannot be edited or deleted. A reversing entry will swap the debits and credits of journal entry <span className="font-mono text-slate-900 font-bold">{selectedJournal}</span> while preserving the historical lineage.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Compliance Justification (Audit Trail Required)
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  placeholder="State reason for reversal, ticket ID, or clearing house memo..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReversal}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Confirm & Post Reversing Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

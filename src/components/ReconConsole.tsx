import React, { useState } from 'react';
import { ReconRunRecord, ReconBreakRecord, AuditLogRecord } from '../types';
import { Play, AlertCircle, History, Check, UserCheck, Shield } from 'lucide-react';

interface ReconConsoleProps {
  reconRuns: ReconRunRecord[];
  breaks: ReconBreakRecord[];
  auditLogs: AuditLogRecord[];
  onTriggerReconRun: (batchId: string, fileName: string) => void;
  onResolveBreak: (breakId: string, action: string, justification: string, operator: string) => void;
}

export const ReconConsole: React.FC<ReconConsoleProps> = ({
  reconRuns,
  breaks,
  auditLogs,
  onTriggerReconRun,
  onResolveBreak,
}) => {
  const [selectedBatchId] = useState<string>('STMT_2026_10_17_SETTL_02');
  const [selectedFileName] = useState<string>('chase_settlement_feed_20261017.csv');

  const [activeBreakToResolve, setActiveBreakToResolve] = useState<ReconBreakRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('POST_FEE_ADJUSTMENT');
  const [justification, setJustification] = useState<string>('Validated interchange network surcharge billed by Chase Clearing.');
  const [operator, setOperator] = useState<string>('auditor_sarah_chen');

  const handleRunRecon = () => {
    onTriggerReconRun(selectedBatchId, selectedFileName);
  };

  const handleConfirmResolution = () => {
    if (activeBreakToResolve) {
      onResolveBreak(activeBreakToResolve.id, resolutionAction, justification, operator);
      setActiveBreakToResolve(null);
    }
  };

  const latestRun = reconRuns[0];
  const unresolvedBreaks = breaks.filter((b) => b.status === 'UNRESOLVED');
  const resolvedBreaks = breaks.filter((b) => b.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Service 3: recon-service
            </span>
            <span className="text-xs text-slate-500 font-medium">Multi-Source Bank Reconciliation & Break Engine</span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-slate-900">Reconciliation & Audit Trail Console</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Ingests external bank settlement CSV feeds, compares against ledger lines, and records discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunRecon}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-all shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger Reconciliation Run (POST /v1/recon/runs)</span>
          </button>
        </div>
      </div>

      {/* Reconciliation Run Summary Cards */}
      {latestRun && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs text-slate-500 mb-1 font-medium">Batch ID / Feed</div>
            <div className="text-sm font-bold font-mono text-slate-900 truncate">{latestRun.statementBatchId}</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">{latestRun.statementFileName}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs text-slate-500 mb-1 font-medium">Total Statement Records</div>
            <div className="text-2xl font-bold font-mono text-slate-900">{latestRun.totalRecords}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">Status: {latestRun.status}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs text-slate-500 mb-1 font-medium">Matched Transactions</div>
            <div className="text-2xl font-bold font-mono text-emerald-700">{latestRun.matchedRecords}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Match rate: {((latestRun.matchedRecords / latestRun.totalRecords) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs text-slate-500 mb-1 font-medium">Unmatched Breaks</div>
            <div className="text-2xl font-bold font-mono text-rose-700">{unresolvedBreaks.length}</div>
            <div className="text-[10px] text-slate-500 mt-1">{resolvedBreaks.length} resolved</div>
          </div>
        </div>
      )}

      {/* Reconciliation Breaks Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Reconciliation Discrepancies & Breaks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Variances requiring operational intervention and regulatory audit documentation.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{breaks.length} total breaks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Break ID</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Statement Amt</th>
                <th className="py-2.5 px-3">Ledger Amt</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breaks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-blue-700 font-bold">{b.id}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.breakType === 'MISSING_IN_LEDGER'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : b.breakType === 'AMOUNT_MISMATCH'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {b.breakType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{b.externalReference}</td>
                  <td className="py-2.5 px-3 text-slate-900">${b.statementAmount.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {b.ledgerAmount !== undefined ? `$${b.ledgerAmount.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-rose-700 font-bold">${b.varianceAmount.toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {b.status === 'UNRESOLVED' ? (
                      <button
                        onClick={() => setActiveBreakToResolve(b)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium px-2.5 py-1 rounded transition-colors font-sans shadow-xs"
                      >
                        Resolve Break
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-sans">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Append-Only Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-700" />
              Append-Only Audit Log (recon_audit_log)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanent immutable compliance ledger tracking all manual interventions and justifications.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{auditLogs.length} audit entries</span>
        </div>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-bold">{log.id}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-700">Break ID: {log.breakId}</span>
                  <span className="text-slate-400">•</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                    {log.actionType}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Operator: {log.operatorUsername}</span>
                  <span>•</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="text-slate-700 text-xs font-sans mt-2">
                <strong className="text-slate-900 font-mono text-xs">Justification: </strong>
                {log.justification}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Resolve Break */}
      {activeBreakToResolve && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg w-full text-slate-900 shadow-xl">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">
                Resolve Break {activeBreakToResolve.id}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              All manual break resolutions generate an immutable append-only record in the compliance audit trail.
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-slate-700">
                <div>Reference: {activeBreakToResolve.externalReference}</div>
                <div>Category: {activeBreakToResolve.breakType}</div>
                <div>Variance: ${activeBreakToResolve.varianceAmount.toFixed(2)} {activeBreakToResolve.currency}</div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Resolution Action</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="POST_FEE_ADJUSTMENT">POST_FEE_ADJUSTMENT (Post adjusting line to Expense account)</option>
                  <option value="REFUND_VARIANCE">REFUND_VARIANCE (Issue partial credit to merchant)</option>
                  <option value="DISCARD_DUPLICATE_FEED">DISCARD_DUPLICATE_FEED (Acknowledge external statement retry)</option>
                  <option value="WRITE_OFF">WRITE_OFF (Under $5 threshold operational write-off)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Authorized Operator</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Compliance Justification (Audit Log)
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  placeholder="Detail cause of variance and bank reference ticket..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveBreakToResolve(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Record in Audit Log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

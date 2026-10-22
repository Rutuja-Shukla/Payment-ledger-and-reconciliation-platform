import React from 'react';
import { ShieldCheck, Database, Layers, AlertTriangle, Sparkles, Code2, Landmark, Briefcase } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOutboxCount: number;
  unresolvedBreaksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pendingOutboxCount,
  unresolvedBreaksCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Brand & Status Bar */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  Payment ledger and reconciliation platform
                </h1>
                <span className="text-[10px] font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  Enterprise Multi-Rail Core
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Java 21 • Spring Boot 3 • PostgreSQL 16 • Apache Kafka • React 18
              </p>
            </div>
          </div>

          {/* Quick Real-Time Metrics */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs">
            <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 flex items-center gap-2">
              <span className="text-slate-500 font-medium">Outbox Queue:</span>
              <span className={`font-mono font-semibold ${pendingOutboxCount > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'}`}>
                {pendingOutboxCount} pending
              </span>
            </div>

            <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 flex items-center gap-2">
              <span className="text-slate-500 font-medium">Recon Breaks:</span>
              <span className={`font-mono font-semibold ${unresolvedBreaksCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {unresolvedBreaksCount} open
              </span>
            </div>

            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Σ Debits = Σ Credits</span>
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto border-t border-slate-100 pt-1 pb-2 scrollbar-none">
          {/* 1st Tab: Live Operations & Workflows */}
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'operations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Live Operations & Workflows
          </button>

          {/* 2nd Tab: Core Features & Advantages */}
          <button
            onClick={() => setActiveTab('capabilities')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'capabilities'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Core Features & Advantages
          </button>

          {/* 3rd Tab: System Architecture */}
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            System Architecture
          </button>

          {/* 4th Tab: Distributed Failure Scenarios */}
          <button
            onClick={() => setActiveTab('failures')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'failures'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Distributed Failure Scenarios
          </button>

          {/* 5th Tab: Codebase & Repositories */}
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            Codebase & Repositories
          </button>
        </div>
      </div>
    </header>
  );
};

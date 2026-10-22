import React, { useState } from 'react';
import { FileCode, Copy, Check, Search } from 'lucide-react';

interface FileEntry {
  path: string;
  category: string;
  language: string;
  description: string;
}

export const CodeExplorer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const files: FileEntry[] = [
    {
      path: '/README.md',
      category: 'Documentation',
      language: 'markdown',
      description: 'Master documentation with system architecture, Mermaid diagrams, failure runbook, and demo script.'
    },
    {
      path: '/pom.xml',
      category: 'Maven Root',
      language: 'xml',
      description: 'Parent Maven POM orchestrating 4 submodules, dependency management, JaCoCo, and plugins.'
    },
    {
      path: '/docker-compose.yml',
      category: 'Infrastructure',
      language: 'yaml',
      description: 'Orchestration for PostgreSQL 16 (multiple DBs), Kafka 3.7 KRaft, Redis 7, Prometheus, and Grafana.'
    },
    {
      path: '/.github/workflows/ci.yml',
      category: 'CI/CD Pipeline',
      language: 'yaml',
      description: 'GitHub Actions workflow: Maven verify, Testcontainers, OWASP scan, Trivy scanner, and kind deploy.'
    },
    {
      path: '/k6/load-test.js',
      category: 'Performance',
      language: 'javascript',
      description: 'k6 load test script benchmarking payment ingestion throughput and sub-50ms idempotency replay.'
    },
    {
      path: '/payment-api/src/main/java/com/bank/payment/service/PaymentService.java',
      category: 'payment-api',
      language: 'java',
      description: 'Transactional Outbox: Atomic single-transaction commit for Payment, Outbox row, and Idempotency hash.'
    },
    {
      path: '/payment-api/src/main/java/com/bank/payment/scheduler/OutboxRelayScheduler.java',
      category: 'payment-api',
      language: 'java',
      description: 'Scheduled relay polling PENDING outbox records, injecting traceparent headers, and dispatching to Kafka.'
    },
    {
      path: '/payment-api/src/main/resources/db/migration/V1__init_payment_schema.sql',
      category: 'payment-api',
      language: 'sql',
      description: 'Flyway migration creating payments, payment_outbox, and idempotency_keys tables.'
    },
    {
      path: '/payment-api/src/test/java/com/bank/payment/PaymentIdempotencyIntegrationTest.java',
      category: 'payment-api (Tests)',
      language: 'java',
      description: 'Testcontainers integration test verifying atomicity, idempotency replay, and 409 conflict detection.'
    },
    {
      path: '/ledger-service/src/main/java/com/bank/ledger/service/LedgerService.java',
      category: 'ledger-service',
      language: 'java',
      description: 'Double-entry engine enforcing sum(Debits) == sum(Credits), pessimistic account locks, and reversing entries.'
    },
    {
      path: '/ledger-service/src/main/java/com/bank/ledger/consumer/PaymentEventConsumer.java',
      category: 'ledger-service',
      language: 'java',
      description: 'Kafka event consumer with RetryableTopic and DeadLetterTopic (@DltHandler) for poison pills.'
    },
    {
      path: '/ledger-service/src/main/java/com/bank/ledger/repository/AccountRepository.java',
      category: 'ledger-service',
      language: 'java',
      description: 'Spring Data JPA repository with PESSIMISTIC_WRITE row locking for concurrent debit defense.'
    },
    {
      path: '/ledger-service/src/main/resources/db/migration/V1__init_ledger_schema.sql',
      category: 'ledger-service',
      language: 'sql',
      description: 'Flyway migration for accounts, journal_entries, ledger_lines, and consumed_events dedupe table.'
    },
    {
      path: '/ledger-service/src/test/java/com/bank/ledger/DoubleEntryInvariantPropertyTest.java',
      category: 'ledger-service (Tests)',
      language: 'java',
      description: 'Mathematical property test verifying sum(Debits) == sum(Credits) and reversing entries immutability.'
    },
    {
      path: '/recon-service/src/main/java/com/bank/recon/service/ReconciliationService.java',
      category: 'recon-service',
      language: 'java',
      description: 'Reconciliation match engine, break classification (MISSING/AMOUNT/DUPE), and append-only audit trail.'
    },
    {
      path: '/recon-service/src/main/java/com/bank/recon/controller/ReconciliationController.java',
      category: 'recon-service',
      language: 'java',
      description: 'REST Controller implementing POST /v1/recon/runs, GET breaks, and POST /v1/recon/breaks/{id}/resolve.'
    },
    {
      path: '/recon-service/src/main/resources/db/migration/V1__init_recon_schema.sql',
      category: 'recon-service',
      language: 'sql',
      description: 'Flyway migration for recon_runs, recon_breaks, and append-only recon_audit_log table.'
    },
    {
      path: '/recon-service/src/test/java/com/bank/recon/ReconciliationBreakResolutionTest.java',
      category: 'recon-service (Tests)',
      language: 'java',
      description: 'Testcontainers test validating automated reconciliation and operator resolution with audit log.'
    },
    {
      path: '/common/src/main/java/com/bank/common/model/Money.java',
      category: 'common',
      language: 'java',
      description: 'Immutable Money record enforcing BigDecimal Banker\'s Rounding (HALF_EVEN) and currency compatibility.'
    },
    {
      path: '/common/src/main/java/com/bank/common/util/HashUtils.java',
      category: 'common',
      language: 'java',
      description: 'Cryptographic SHA-256 payload hashing utility for deterministic idempotency fingerprinting.'
    }
  ];

  const filteredFiles = files.filter(
    (f) =>
      f.path.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
  );

  const [selectedFile, setSelectedFile] = useState<FileEntry>(files[0]);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(selectedFile.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Java 21 / Spring Boot 3 Multi-Module
            </span>
            <span className="text-xs text-slate-500 font-medium">Source Code Directory & Manifests</span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-slate-900">Repository Structure & Artifacts</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Explore the Java source classes, Flyway database migrations, Docker Compose orchestration, and Testcontainers suites.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>{files.length} production files in repository</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Navigator (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search classes, migrations, tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 text-slate-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                      <span className="text-blue-700 font-semibold">{file.category}</span>
                      <span className="uppercase">{file.language}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 truncate">
                      <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{file.path}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* File Details & Source Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  {selectedFile.category}
                </span>
                <h3 className="text-sm font-bold font-mono text-slate-900 mt-1 truncate">
                  {selectedFile.path}
                </h3>
              </div>

              <button
                onClick={handleCopyPath}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors font-medium font-sans"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Path'}</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4 text-xs text-slate-700">
              <strong className="text-slate-900 block mb-1">Architectural Role:</strong>
              {selectedFile.description}
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <div className="text-slate-400 mb-2 text-[11px]">// File path in repository: {selectedFile.path}</div>
              <div className="text-slate-300 leading-relaxed font-sans text-xs">
                This file is fully implemented in the project repository. It can be compiled, tested, or executed using standard Maven workflows:
              </div>
              <div className="mt-3 p-2.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px]">
                $ ./mvnw clean verify -Dtest={selectedFile.path.split('/').pop()?.replace('.java', '')}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Java 21 LTS • Spring Boot 3.3.4</span>
            <span className="font-semibold text-slate-700">Production Microservices Archetype</span>
          </div>
        </div>
      </div>
    </div>
  );
};

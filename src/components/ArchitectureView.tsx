import React, { useState } from 'react';
import {
  Database,
  Shield,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Lock,
  Cpu,
  CheckCircle2,
  Code2,
  Split,
  Landmark,
  Layers,
  Server,
  Zap,
  Box,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  HardDrive,
  Network,
} from 'lucide-react';

const DOCKER_COMPOSE_PREVIEW = `version: '3.8'

networks:
  payment-network:
    driver: bridge

volumes:
  pgdata:
  redisdata:
  prometheus-data:
  grafana-data:

services:
  postgres:
    image: postgres:16-alpine
    container_name: bank_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_MULTIPLE_DATABASES: payment_db,ledger_db,recon_db
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: bank_kafka
    ports: ["9092:9092"]
    environment:
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092'

  redis:
    image: redis:7-alpine
    container_name: bank_redis
    ports: ["6379:6379"]

  payment-api:
    build: { context: ., dockerfile: payment-api/Dockerfile }
    container_name: bank_payment_api
    ports: ["8080:8080"]
    depends_on: [postgres, kafka, redis]

  ledger-service:
    build: { context: ., dockerfile: ledger-service/Dockerfile }
    container_name: bank_ledger_service
    ports: ["8081:8081"]
    depends_on: [postgres, kafka]

  recon-service:
    build: { context: ., dockerfile: recon-service/Dockerfile }
    container_name: bank_recon_service
    ports: ["8082:8082"]
    depends_on: [postgres, kafka]

  frontend:
    build: { context: ., dockerfile: Dockerfile }
    container_name: bank_frontend
    ports: ["3000:3000"]
    depends_on: [payment-api, ledger-service, recon-service]`;

export const ArchitectureView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('reactControl');
  const [activeDockerTab, setActiveDockerTab] = useState<'containers' | 'topology' | 'compose' | 'logs'>('containers');
  const [selectedLogService, setSelectedLogService] = useState<string>('bank_payment_api');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const nodeDetails: Record<
    string,
    {
      title: string;
      tech: string;
      responsibility: string;
      architecturalRationale: string;
      tradeoffs: string;
      files: string[];
    }
  > = {
    reactControl: {
      title: 'React 18 Operational Control Plane & Client Invariant Engine',
      tech: 'React 18.3, Vite 5.4, Lucide Icons, Enterprise State Engine',
      responsibility:
        'Acts as the enterprise operator control plane. Enforces client-side validation, runs real-time trial balance equilibrium checks (ΣDebits == ΣCredits), coordinates RFC idempotency keys, and visualizes double-entry T-accounts with sub-millisecond responsiveness.',
      architecturalRationale:
        'A reactive frontend control plane provides instantaneous verification of complex multi-rail transactions (marketplace splits, prorated refunds, 3-way matches) before and after distributed commit, giving operators deep audit visibility without polling lag.',
      tradeoffs:
        'Requires rigorous client-side state modeling and synchronization with backend Kafka outbox stream events.',
      files: [
        '/src/components/RealWorldScenarios.tsx',
        '/src/components/LedgerConsole.tsx',
        '/src/components/PaymentApiConsole.tsx',
        '/src/components/ReconConsole.tsx',
      ],
    },
    paymentApi: {
      title: 'payment-api (Ingestion Service & Idempotency)',
      tech: 'Spring Boot 3.3, Spring Data JPA, Redis 7, PostgreSQL 16',
      responsibility:
        'Enforces RFC-7231 idempotency fingerprinting via SHA-256 payload hashing in Redis with PostgreSQL fallback. Commits payment record and outbox message in ONE atomic local database transaction.',
      architecturalRationale:
        'Solves the Dual-Write problem. If the service wrote to PostgreSQL and subsequently attempted a synchronous HTTP or Kafka call, an application crash between the two creates unrecoverable state divergence.',
      tradeoffs:
        'Outbox table adds slight write overhead to the database, but guarantees 100% durability and zero lost messages.',
      files: [
        '/payment-api/src/main/java/com/bank/payment/controller/PaymentController.java',
        '/payment-api/src/main/java/com/bank/payment/service/PaymentService.java',
        '/payment-api/src/main/resources/db/migration/V1__init_payment_schema.sql',
      ],
    },
    outbox: {
      title: 'Transactional Outbox & Relay Worker',
      tech: 'Spring Scheduling / CDC Polling, KafkaTemplate, W3C Distributed Tracing',
      responsibility:
        'Polls pending outbox records, injects OpenTelemetry W3C traceparent headers, and publishes events to Apache Kafka using aggregateId (paymentId) as partition key.',
      architecturalRationale:
        'Decouples client response latency from Kafka broker health. If Kafka undergoes a leader election or rebalance, client payments continue accepting immediately with HTTP 201 Created.',
      tradeoffs:
        'Polling introduces slight event propagation delay (50ms - 500ms). For ultra-high volume, Debezium CDC streaming Postgres WAL can be swapped in transparently.',
      files: ['/payment-api/src/main/java/com/bank/payment/scheduler/OutboxRelayScheduler.java'],
    },
    kafka: {
      title: 'Apache Kafka Broker Cluster & DLT',
      tech: 'Kafka 3.7 (KRaft mode), Strict Partitions, Dead-Letter Topic (DLT)',
      responsibility:
        'Durable, partitioned event stream. Partitioned strictly by paymentId to guarantee sequential event ordering per transaction (e.g., AUTHORIZED must precede SETTLED).',
      architecturalRationale:
        'Kafka provides horizontal scalability and replayable event logs. The Dead-Letter Topic (DLT) isolates poison-pill payloads with stack trace headers so healthy transactions never stall.',
      tradeoffs:
        'At-least-once delivery requires downstream ledger consumers to maintain idempotent event deduplication.',
      files: [
        '/infra/docker-compose.yml',
        '/ledger-service/src/main/java/com/bank/ledger/consumer/PaymentEventConsumer.java',
      ],
    },
    multiRail: {
      title: 'Multi-Rail Settlement & Prorated Refund Engine',
      tech: 'Domain Settlement Logic, Idempotency Guards, Over-Refund Guard',
      responsibility:
        'Handles 4-leg marketplace split disbursements (Merchant, Interchange, Take-Rate, Rolling Reserve), bulk ACH batch payouts, dispute escrow holds, and partial refunds with pro-rata reserve clawback.',
      architecturalRationale:
        'Centralizing multi-rail settlement logic ensures uniform application of risk buffers, fee formulas, and over-refund guards across card networks, ACH, and wire transfers.',
      tradeoffs:
        'Complex business rules require strict mathematical unit testing to verify that sum(Debits) equals sum(Credits) across all fee legs.',
      files: [
        '/src/types/index.ts',
        '/payment-api/src/main/java/com/bank/payment/controller/PaymentController.java',
      ],
    },
    ledgerService: {
      title: 'ledger-service (Double-Entry Invariant Engine)',
      tech: 'Spring Boot 3, Spring Data JPA, Pessimistic Row Locking, Flyway, PostgreSQL 16',
      responsibility:
        'Idempotently consumes payment events, verifies sum(Debits) == sum(Credits), and writes immutable journal entries using SELECT ... FOR UPDATE pessimistic row locks on accounts.',
      architecturalRationale:
        'Double-entry bookkeeping is the universal GAAP/FASB standard for financial accounting. Pessimistic row locking eliminates concurrent debit race conditions, completely preventing illegal negative balances and overdraft storms.',
      tradeoffs:
        'Pessimistic row locking on hot accounts serializes transactions. At massive scale, virtual sharded balancing accounts are utilized.',
      files: [
        '/ledger-service/src/main/java/com/bank/ledger/service/LedgerService.java',
        '/ledger-service/src/main/resources/db/migration/V1__init_ledger_schema.sql',
      ],
    },
    reconTreasury: {
      title: '3-Way Reconciliation & Treasury Liquidity Sweeps',
      tech: 'Spring Boot 3, Apache Commons CSV, Append-Only Audit Log, Treasury Router',
      responsibility:
        'Normalizes external bank settlement CSV feeds, executes 3-way matching against internal ledger lines and processor statements, resolves tolerance variances, and executes automated overnight liquidity sweeps.',
      architecturalRationale:
        'Internal ledgers and external bank statements inherently diverge due to network fees, processing delays, and cut-off windows. Configurable tolerance matching and immutable audit logs ensure full compliance with bank auditor mandates.',
      tradeoffs:
        'Reconciliation matching involves multi-table correlation that must be optimized with indexed timestamps and transaction hashes.',
      files: [
        '/recon-service/src/main/java/com/bank/recon/service/ReconciliationService.java',
        '/recon-service/src/main/resources/db/migration/V1__init_recon_schema.sql',
      ],
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Payment ledger and reconciliation platform System Architecture
              </span>
              <span className="text-xs text-slate-500 font-medium">Distributed Microservices & React 18 Control Plane</span>
            </div>
            <h2 className="text-xl font-bold mt-2 text-slate-900">End-to-End Architectural Data Flow & Topologies</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Select any component below to inspect its transactional boundaries, database schema invariants, source code files, and architectural rationale.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>React 18 Control Plane</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>ACID Outbox</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Kafka Partitions</span>
            </div>
          </div>
        </div>

        {/* Visual Topology Diagram (7 Steps) */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Node 1: React 18 */}
          <button
            onClick={() => setSelectedNode('reactControl')}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              selectedNode === 'reactControl'
                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-mono text-[10px] font-bold text-blue-700">Step 1</span>
                <Code2 className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">React 18 Control Plane</h4>
              <p className="text-[10px] text-slate-500 mt-1">Live Invariant Check</p>
            </div>
            <div className="mt-2.5 text-[9px] font-mono bg-blue-50 p-1 rounded border border-blue-200 text-blue-800 font-semibold truncate">
              ΣDr = ΣCr
            </div>
          </button>

          {/* Node 2: payment-api */}
          <button
            onClick={() => setSelectedNode('paymentApi')}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              selectedNode === 'paymentApi'
                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-mono text-[10px] font-bold text-emerald-700">Step 2</span>
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">payment-api</h4>
              <p className="text-[10px] text-slate-500 mt-1">1 Atomic ACID Tx</p>
            </div>
            <div className="mt-2.5 text-[9px] font-mono bg-emerald-50 p-1 rounded border border-emerald-200 text-emerald-800 font-semibold truncate">
              Payment + Outbox
            </div>
          </button>

          {/* Node 3: Outbox Relay */}
          <button
            onClick={() => setSelectedNode('outbox')}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              selectedNode === 'outbox'
                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-mono text-[10px] font-bold text-amber-700">Step 3</span>
                <RefreshCw className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">Outbox Relay</h4>
              <p className="text-[10px] text-slate-500 mt-1">Drains PENDING</p>
            </div>
            <div className="mt-2.5 text-[9px] font-mono bg-amber-50 p-1 rounded border border-amber-200 text-amber-800 font-semibold truncate">
              Poll / CDC &rarr; Kafka
            </div>
          </button>

          {/* Node 4: Kafka */}
          <button
            onClick={() => setSelectedNode('kafka')}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              selectedNode === 'kafka'
                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-mono text-[10px] font-bold text-indigo-700">Step 4</span>
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">Apache Kafka</h4>
              <p className="text-[10px] text-slate-500 mt-1">Durable Log & DLT</p>
            </div>
            <div className="mt-2.5 text-[9px] font-mono bg-indigo-50 p-1 rounded border border-indigo-200 text-indigo-800 font-semibold truncate">
              Key = paymentId
            </div>
          </button>

          {/* Node 5: Multi-Rail */}
          <button
            onClick={() => setSelectedNode('multiRail')}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              selectedNode === 'multiRail'
                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-mono text-[10px] font-bold text-cyan-700">Step 5</span>
                <Split className="w-4 h-4 text-cyan-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">Multi-Rail Engine</h4>
              <p className="text-[10px] text-slate-500 mt-1">Split, Refund & ACH</p>
            </div>
            <div className="mt-2.5 text-[9px] font-mono bg-cyan-50 p-1 rounded border border-cyan-200 text-cyan-800 font-semibold truncate">
              Take-Rate & Reserves
            </div>
          </button>

          {/* Node 6: ledger-service */}
          <button
            onClick={() => setSelectedNode('ledgerService')}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              selectedNode === 'ledgerService'
                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-mono text-[10px] font-bold text-teal-700">Step 6</span>
                <Database className="w-4 h-4 text-teal-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">ledger-service</h4>
              <p className="text-[10px] text-slate-500 mt-1">Double-Entry Locks</p>
            </div>
            <div className="mt-2.5 text-[9px] font-mono bg-teal-50 p-1 rounded border border-teal-200 text-teal-800 font-semibold truncate">
              Debits == Credits
            </div>
          </button>

          {/* Node 7: reconTreasury */}
          <button
            onClick={() => setSelectedNode('reconTreasury')}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              selectedNode === 'reconTreasury'
                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-mono text-[10px] font-bold text-blue-700">Step 7</span>
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">3-Way Recon & Treasury</h4>
              <p className="text-[10px] text-slate-500 mt-1">Bank Statement Match</p>
            </div>
            <div className="mt-2.5 text-[9px] font-mono bg-blue-50 p-1 rounded border border-blue-200 text-blue-800 font-semibold truncate">
              Breaks & Sweeps
            </div>
          </button>
        </div>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && nodeDetails[selectedNode] && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
            <div>
              <span className="text-xs font-mono text-blue-700 font-semibold uppercase tracking-wider">
                Component Specification & Guarantees
              </span>
              <h3 className="text-lg font-bold text-slate-900">{nodeDetails[selectedNode].title}</h3>
            </div>
            <div className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-700 border border-slate-200 self-start sm:self-auto font-semibold">
              {nodeDetails[selectedNode].tech}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Core Responsibility
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {nodeDetails[selectedNode].responsibility}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                Architectural Rationale
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {nodeDetails[selectedNode].architecturalRationale}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Architectural Trade-offs
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {nodeDetails[selectedNode].tradeoffs}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span className="font-mono font-medium text-slate-700">Source Implementation Files:</span>
            <div className="flex flex-wrap gap-2">
              {nodeDetails[selectedNode].files.map((file, idx) => (
                <span
                  key={idx}
                  className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200 text-[11px]"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-Stack Polyglot Technology Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Payment ledger and reconciliation platform Full-Stack Technology Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Production technology choices and distribution of responsibilities across the frontend and distributed backend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Frontend Stack */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-blue-600" />
                Frontend Control Plane
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                Client Layer
              </span>
            </div>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="flex items-center justify-between">
                <span>UI Framework:</span>
                <span className="font-mono font-bold text-slate-900">React 18.3 (Hooks & State Machines)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Domain Modeling:</span>
                <span className="font-mono font-bold text-slate-900">Atomic Invariant Model</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Build Tool:</span>
                <span className="font-mono font-bold text-slate-900">Vite 5.4</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Design System:</span>
                <span className="font-mono font-bold text-slate-900">Financial Modern Tokens</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Iconography:</span>
                <span className="font-mono font-bold text-slate-900">Lucide React</span>
              </li>
            </ul>
          </div>

          {/* Distributed Backend Microservices */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                Distributed Core Services
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Java / Spring
              </span>
            </div>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="flex items-center justify-between">
                <span>Runtime:</span>
                <span className="font-mono font-bold text-slate-900">Java 21 LTS (GraalVM Ready)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Framework:</span>
                <span className="font-mono font-bold text-slate-900">Spring Boot 3.3</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Persistence:</span>
                <span className="font-mono font-bold text-slate-900">Spring Data JPA + Hibernate 6</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Database Migrations:</span>
                <span className="font-mono font-bold text-slate-900">Flyway Enterprise Versioning</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Event Ingestion:</span>
                <span className="font-mono font-bold text-slate-900">Spring Kafka Consumer / Producer</span>
              </li>
            </ul>
          </div>

          {/* Storage & Event Streaming */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                Storage & Streaming Layer
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                Data Infrastructure
              </span>
            </div>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="flex items-center justify-between">
                <span>Relational Store:</span>
                <span className="font-mono font-bold text-slate-900">PostgreSQL 16 (Row-Level Locking)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Streaming Broker:</span>
                <span className="font-mono font-bold text-slate-900">Apache Kafka 3.7 (KRaft Mode)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Distributed Cache:</span>
                <span className="font-mono font-bold text-slate-900">Redis 7 (SHA-256 Fingerprints)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Observability:</span>
                <span className="font-mono font-bold text-slate-900">Micrometer + W3C Traceparent</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Integration Testing:</span>
                <span className="font-mono font-bold text-slate-900">Testcontainers (Postgres & Kafka)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Turnkey Docker Deployment & Container Orchestration Fleet */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <Box className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  Turnkey Docker Container Orchestration
                </h3>
                <p className="text-xs text-slate-500">
                  9 production-grade containers orchestrated with health checks, persistent volumes, and network isolation.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Deploy Commands */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCopy('./deploy-docker.sh up')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono rounded-lg transition-colors shadow-xs"
              title="Copy deployment command"
            >
              {copiedText === './deploy-docker.sh up' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>./deploy-docker.sh up</span>
            </button>

            <button
              onClick={() => handleCopy('docker compose up --build -d')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded-lg transition-colors border border-slate-300"
              title="Copy docker compose command"
            >
              {copiedText === 'docker compose up --build -d' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>docker compose up -d</span>
            </button>
          </div>
        </div>

        {/* Docker Module Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveDockerTab('containers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeDockerTab === 'containers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Container Fleet (9)</span>
          </button>

          <button
            onClick={() => setActiveDockerTab('topology')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeDockerTab === 'topology'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Network & Ingress Topology</span>
          </button>

          <button
            onClick={() => setActiveDockerTab('compose')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeDockerTab === 'compose'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>docker-compose.yml</span>
          </button>

          <button
            onClick={() => setActiveDockerTab('logs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeDockerTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Container Logs Stream</span>
          </button>
        </div>

        {/* Tab 1: Containers Fleet */}
        {activeDockerTab === 'containers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'bank_frontend',
                  service: 'frontend',
                  title: 'React Operations Console',
                  image: 'payment-ledger/frontend:latest',
                  base: 'node:20-alpine -> nginx:1.27-alpine',
                  port: '3000:3000',
                  health: 'wget --spider http://localhost:3000/healthz',
                  role: 'SPA Reverse Proxy & Operator UI',
                  status: 'healthy',
                  memory: '38 MB',
                },
                {
                  id: 'bank_payment_api',
                  service: 'payment-api',
                  title: 'Payment API & Outbox',
                  image: 'payment-ledger/payment-api:latest',
                  base: 'eclipse-temurin:21-jre-alpine',
                  port: '8080:8080',
                  health: 'GET /actuator/health',
                  role: 'Idempotency & Outbox Polling Relay',
                  status: 'healthy',
                  memory: '242 MB',
                },
                {
                  id: 'bank_ledger_service',
                  service: 'ledger-service',
                  title: 'Double-Entry Ledger Core',
                  image: 'payment-ledger/ledger-service:latest',
                  base: 'eclipse-temurin:21-jre-alpine',
                  port: '8081:8081',
                  health: 'GET /actuator/health',
                  role: 'Kafka Consumer & Trial Balance Invariants',
                  status: 'healthy',
                  memory: '228 MB',
                },
                {
                  id: 'bank_recon_service',
                  service: 'recon-service',
                  title: '3-Way Reconciliation Service',
                  image: 'payment-ledger/recon-service:latest',
                  base: 'eclipse-temurin:21-jre-alpine',
                  port: '8082:8082',
                  health: 'GET /actuator/health',
                  role: 'Multi-Source CAMT.053 & Break Resolution',
                  status: 'healthy',
                  memory: '215 MB',
                },
                {
                  id: 'bank_postgres',
                  service: 'postgres',
                  title: 'PostgreSQL 16 Multi-DB',
                  image: 'postgres:16-alpine',
                  base: 'Alpine Linux 3.19',
                  port: '5432:5432',
                  health: 'pg_isready -U postgres',
                  role: 'payment_db, ledger_db, recon_db (WORM)',
                  status: 'healthy',
                  memory: '64 MB',
                },
                {
                  id: 'bank_kafka',
                  service: 'kafka',
                  title: 'Apache Kafka 3.7 (KRaft)',
                  image: 'confluentinc/cp-kafka:7.6.0',
                  base: 'UBI 9 Minimal',
                  port: '9092:9092',
                  health: 'nc -z localhost 9092',
                  role: 'At-least-once payment.events broker',
                  status: 'healthy',
                  memory: '340 MB',
                },
                {
                  id: 'bank_redis',
                  service: 'redis',
                  title: 'Redis 7 In-Memory Cache',
                  image: 'redis:7-alpine',
                  base: 'Alpine Linux 3.19',
                  port: '6379:6379',
                  health: 'redis-cli ping',
                  role: 'SHA-256 Idempotency Cache & Distributed Locks',
                  status: 'healthy',
                  memory: '12 MB',
                },
                {
                  id: 'bank_prometheus',
                  service: 'prometheus',
                  title: 'Prometheus Metrics Collector',
                  image: 'prom/prometheus:v2.52.0',
                  base: 'Scratch / Static Binary',
                  port: '9090:9090',
                  health: 'GET /-/healthy',
                  role: 'Scrapes Spring Boot Micrometer Metrics (5s)',
                  status: 'healthy',
                  memory: '45 MB',
                },
                {
                  id: 'bank_grafana',
                  service: 'grafana',
                  title: 'Grafana Observability',
                  image: 'grafana/grafana:10.4.2',
                  base: 'Alpine Linux',
                  port: '3001:3000',
                  health: 'GET /api/health',
                  role: 'Outbox Throughput & Invariant Dashboards',
                  status: 'healthy',
                  memory: '55 MB',
                },
              ].map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-mono font-bold text-xs text-slate-900">{c.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{c.title}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase border border-emerald-200">
                      {c.status}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Host Port:</span>
                      <span className="text-blue-600 font-bold">{c.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Memory:</span>
                      <span className="text-slate-800">{c.memory}</span>
                    </div>
                    <div className="flex justify-between truncate" title={c.health}>
                      <span className="text-slate-400">Health:</span>
                      <span className="text-slate-700 truncate max-w-[150px]">{c.health}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">Role: </span>
                    {c.role}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Row */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>Automated Health Dependencies:</strong> Microservices wait for PostgreSQL, Kafka, and Redis to enter healthy status before starting Spring Boot context.
                </span>
              </div>
              <button
                onClick={() => handleCopy('./deploy-docker.sh smoke-test')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-800 border border-blue-300 font-mono text-[11px] rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Run Health Smoke Test
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Topology & Network Map */}
        {activeDockerTab === 'topology' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-slate-200 p-5 rounded-xl font-mono text-xs overflow-x-auto space-y-3">
              <div className="text-emerald-400 font-bold text-sm border-b border-slate-800 pb-2">
                # Docker Bridge Network: payment-network (172.28.0.0/16)
              </div>
              <div className="space-y-2 leading-relaxed text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">[Host Browser]</span>
                  <span className="text-slate-500">──(port 3000)──&gt;</span>
                  <span className="text-amber-300 font-bold">bank_frontend (Nginx Reverse Proxy)</span>
                </div>
                <div className="pl-6 border-l border-slate-700 space-y-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├── /api/payments/* ──&gt;</span>
                    <span className="text-blue-400 font-bold">bank_payment_api:8080</span>
                    <span className="text-slate-500">──&gt; [Postgres :5432/payment_db, Kafka :29092, Redis :6379]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├── /api/ledger/*   ──&gt;</span>
                    <span className="text-blue-400 font-bold">bank_ledger_service:8081</span>
                    <span className="text-slate-500">──&gt; [Postgres :5432/ledger_db, Kafka Consumer :29092]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├── /api/recon/*    ──&gt;</span>
                    <span className="text-blue-400 font-bold">bank_recon_service:8082</span>
                    <span className="text-slate-500">──&gt; [Postgres :5432/recon_db, Kafka Consumer :29092]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">└── /* (SPA Routing)──&gt;</span>
                    <span className="text-emerald-300">/usr/share/nginx/html/index.html (React 18 SPA)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-slate-400">
                  <span className="text-purple-400">[Observability Pipeline]</span>
                  <span>bank_prometheus:9090 scrapes actuator endpoints every 5s ──&gt; bank_grafana:3001</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Persistent Volumes</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Named Docker volumes <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">pgdata</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">redisdata</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">grafana-data</code> preserve state across container restarts and builds.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Multi-Stage Compiles</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Frontend builds inside Node 20 and runs on Nginx Alpine. Java services build in Maven 3.9 and run inside lean Eclipse Temurin 21 JRE without SDK overhead.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Security Non-Root User</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Microservice containers execute under dedicated unprivileged <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">appuser:appgroup</code> to prevent privilege escalation vulnerabilities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: docker-compose.yml Viewer */}
        {activeDockerTab === 'compose' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono text-slate-800 font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                docker-compose.yml (Fleet Definition)
              </span>
              <button
                onClick={() => handleCopy('docker compose up --build -d')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Command</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-300 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[380px] border border-slate-800">
              {DOCKER_COMPOSE_PREVIEW}
            </pre>

          </div>
        )}

        {/* Tab 4: Live Logs Simulator */}
        {activeDockerTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Container Log Stream Simulator
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'bank_payment_api', label: 'payment-api' },
                  { id: 'bank_ledger_service', label: 'ledger-service' },
                  { id: 'bank_recon_service', label: 'recon-service' },
                  { id: 'bank_postgres', label: 'postgres' },
                  { id: 'bank_kafka', label: 'kafka' },
                  { id: 'bank_frontend', label: 'frontend (nginx)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedLogService(s.id)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                      selectedLogService === s.id
                        ? 'bg-slate-900 text-emerald-400 border-slate-900 font-bold'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl border border-slate-800 h-64 overflow-y-auto space-y-1">
              {selectedLogService === 'bank_payment_api' && (
                <>
                  <p className="text-slate-500">2026-10-22T09:14:02.102Z INFO [payment-api,,] 1 --- [main] c.b.p.PaymentApiApplication : Starting PaymentApiApplication v1.0.0 using Java 21</p>
                  <p className="text-slate-500">2026-10-22T09:14:03.411Z INFO [payment-api,,] 1 --- [main] o.f.c.i.database.base.Database : Database: jdbc:postgresql://postgres:5432/payment_db (PostgreSQL 16.2)</p>
                  <p className="text-emerald-400">2026-10-22T09:14:03.498Z INFO [payment-api,,] 1 --- [main] o.f.core.internal.command.DbMigrate : Successfully applied 1 migration to schema 'public' (execution time 00:00.082s)</p>
                  <p className="text-slate-500">2026-10-22T09:14:04.200Z INFO [payment-api,,] 1 --- [main] o.s.b.w.e.tomcat.TomcatWebServer : Tomcat initialized with port 8080 (http)</p>
                  <p className="text-cyan-400">2026-10-22T09:14:05.109Z INFO [payment-api,,] 1 --- [scheduling-1] c.b.p.s.OutboxRelayScheduler : Polling outbox table for PENDING events. Found 0 records.</p>
                  <p className="text-emerald-300">2026-10-22T09:14:05.120Z INFO [payment-api,,] 1 --- [main] c.b.p.PaymentApiApplication : Started PaymentApiApplication in 3.42 seconds (process running for 3.91)</p>
                  <p className="text-slate-400">2026-10-22T09:14:08.550Z INFO [payment-api,traceId=a81f,spanId=c201] 1 --- [http-nio-8080-exec-1] c.b.p.c.PaymentController : Processing payment request idempotencyKey=idem_78912 amount=2500.00 USD</p>
                  <p className="text-emerald-400">2026-10-22T09:14:08.572Z INFO [payment-api,traceId=a81f,spanId=c201] 1 --- [http-nio-8080-exec-1] c.b.p.s.PaymentService : Persisted Payment record pay_4901 and Outbox event in single atomic transaction.</p>
                  <p className="text-cyan-400">2026-10-22T09:14:09.001Z INFO [payment-api,,] 1 --- [scheduling-1] c.b.p.s.OutboxRelayScheduler : Relay published outbox event evt_9941 to Kafka topic 'payment.events' partition 0 offset 1042.</p>
                </>
              )}

              {selectedLogService === 'bank_ledger_service' && (
                <>
                  <p className="text-slate-500">2026-10-22T09:14:04.100Z INFO [ledger-service,,] 1 --- [main] c.b.l.LedgerApplication : Starting LedgerApplication v1.0.0 on container bank_ledger_service</p>
                  <p className="text-emerald-400">2026-10-22T09:14:04.600Z INFO [ledger-service,,] 1 --- [main] o.f.core.internal.command.DbMigrate : Successfully applied 1 migration (V1__init_ledger_schema.sql) to ledger_db</p>
                  <p className="text-slate-500">2026-10-22T09:14:05.300Z INFO [ledger-service,,] 1 --- [main] o.a.k.c.c.internals.ConsumerCoordinator : [Consumer clientId=ledger-consumer-1, groupId=ledger-service-group] Discovered group coordinator kafka:29092</p>
                  <p className="text-cyan-300">2026-10-22T09:14:06.100Z INFO [ledger-service,,] 1 --- [main] o.s.b.w.e.tomcat.TomcatWebServer : Tomcat started on port 8081 (http) with context path ''</p>
                  <p className="text-emerald-300">2026-10-22T09:14:09.015Z INFO [ledger-service,traceId=a81f,spanId=c202] 1 --- [org.springframework.kafka.KafkaListenerEndpointContainer#0-0-C-1] c.b.l.c.PaymentEventConsumer : Received PaymentInitiatedEvent for paymentId=pay_4901</p>
                  <p className="text-slate-300">2026-10-22T09:14:09.030Z INFO [ledger-service,traceId=a81f,spanId=c202] 1 --- [org.springframework.kafka.KafkaListenerEndpointContainer#0-0-C-1] c.b.l.s.LedgerService : Creating double-entry journal entry. DEBIT=2500.00 USD, CREDIT=2500.00 USD. Equation Invariant: BALANCED (diff=0.00)</p>
                  <p className="text-emerald-400">2026-10-22T09:14:09.048Z INFO [ledger-service,traceId=a81f,spanId=c202] 1 --- [org.springframework.kafka.KafkaListenerEndpointContainer#0-0-C-1] c.b.l.c.PaymentEventConsumer : Event evt_9941 processed & committed to consumed_events table successfully.</p>
                </>
              )}

              {selectedLogService === 'bank_recon_service' && (
                <>
                  <p className="text-slate-500">2026-10-22T09:14:05.500Z INFO [recon-service,,] 1 --- [main] c.b.r.ReconApplication : Starting ReconApplication v1.0.0 on port 8082</p>
                  <p className="text-emerald-400">2026-10-22T09:14:05.900Z INFO [recon-service,,] 1 --- [main] o.f.core.internal.command.DbMigrate : Schema recon_db validated. Migrations current.</p>
                  <p className="text-cyan-400">2026-10-22T09:14:07.120Z INFO [recon-service,,] 1 --- [main] c.b.r.s.ReconciliationService : Loaded 3 reconciliation rules: RULE_EXACT_AMOUNT_MATCH, RULE_FEE_TOLERANCE_MATCH, RULE_CURRENCY_ISO_MATCH</p>
                  <p className="text-slate-300">2026-10-22T09:14:12.440Z INFO [recon-service,,] 1 --- [http-nio-8082-exec-1] c.b.r.c.ReconciliationController : Executing 3-way reconciliation run for clearingCycle=2026-10-22. Processed 150 items. 148 MATCHED, 2 BREAKS detected.</p>
                </>
              )}

              {selectedLogService === 'bank_postgres' && (
                <>
                  <p className="text-slate-500">PostgreSQL Database directory appears to contain a database; Skipping initialization</p>
                  <p className="text-slate-400">2026-10-22 09:14:00.120 UTC [1] LOG:  starting PostgreSQL 16.2 on x86_64-pc-linux-musl</p>
                  <p className="text-emerald-400">2026-10-22 09:14:00.150 UTC [1] LOG:  database system is ready to accept connections</p>
                  <p className="text-cyan-300">2026-10-22 09:14:03.400 UTC [34] LOG:  connection authorized: user=postgres database=payment_db</p>
                  <p className="text-cyan-300">2026-10-22 09:14:04.580 UTC [48] LOG:  connection authorized: user=postgres database=ledger_db</p>
                  <p className="text-cyan-300">2026-10-22 09:14:05.880 UTC [62] LOG:  connection authorized: user=postgres database=recon_db</p>
                </>
              )}

              {selectedLogService === 'bank_kafka' && (
                <>
                  <p className="text-slate-500">[2026-10-22 09:14:00,320] INFO [KafkaRaftServer nodeId=1] Kafka KRaft server starting...</p>
                  <p className="text-emerald-400">[2026-10-22 09:14:01,010] INFO [RaftManager id=1] Log recovery complete. High watermark is 4102</p>
                  <p className="text-cyan-300">[2026-10-22 09:14:01,890] INFO [SocketServer listenerType=ZK_BROKER, nodeId=1] Created data-plane acceptor and processors on port 29092</p>
                  <p className="text-emerald-300">[2026-10-22 09:14:02,100] INFO [KafkaServer id=1] started (kafka.server.KafkaServer)</p>
                  <p className="text-slate-400">[2026-10-22 09:14:09,002] INFO [GroupCoordinator 1]: Preparing to rebalance group ledger-service-group in mode Classic</p>
                </>
              )}

              {selectedLogService === 'bank_frontend' && (
                <>
                  <p className="text-slate-500">2026/10/22 09:14:06 [notice] 1#1: using the "epoll" event method</p>
                  <p className="text-slate-500">2026/10/22 09:14:06 [notice] 1#1: nginx/1.27.0</p>
                  <p className="text-emerald-400">2026/10/22 09:14:06 [notice] 1#1: start worker processes</p>
                  <p className="text-slate-400">127.0.0.1 - - [22/Oct/2026:09:14:15 +0000] "GET /healthz HTTP/1.1" 200 2 "-" "Wget"</p>
                  <p className="text-cyan-300">172.28.0.1 - - [22/Oct/2026:09:14:18 +0000] "GET / HTTP/1.1" 200 4519 "-" "Mozilla/5.0"</p>
                  <p className="text-cyan-300">172.28.0.1 - - [22/Oct/2026:09:14:18 +0000] "GET /assets/index-D7.js HTTP/1.1" 200 148123 "http://localhost:3000/"</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

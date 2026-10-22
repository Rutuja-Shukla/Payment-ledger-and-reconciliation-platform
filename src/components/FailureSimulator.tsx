import React, { useState } from 'react';
import { failureScenarios } from '../data/mockData';
import { FailureScenario } from '../types';
import { AlertTriangle, Play, CheckCircle2, ShieldAlert, BookOpen, Code2, RefreshCw } from 'lucide-react';

export const FailureSimulator: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<FailureScenario>(failureScenarios[0]);
  const [simStep, setSimStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runSimulation = () => {
    setIsRunning(true);
    setSimStep(1);
    setTimeout(() => setSimStep(2), 1200);
    setTimeout(() => setSimStep(3), 2400);
    setTimeout(() => {
      setSimStep(4);
      setIsRunning(false);
    }, 3600);
  };

  const getStepText = (step: number, scenarioId: string) => {
    switch (scenarioId) {
      case 'scenario_1':
        if (step === 1) return '1. Client submits payment. payment-api executes atomic DB transaction (Payment + Outbox record inserted).';
        if (step === 2) return '2. PROCESS TERMINATION: JVM abruptly killed before KafkaTemplate.send() executes.';
        if (step === 3) return '3. Container orchestrator spawns replica. Outbox table on disk remains 100% intact with PENDING status.';
        if (step === 4) return '4. OutboxRelayScheduler polls PENDING row, publishes to Kafka, and marks status PUBLISHED. Zero data loss.';
        break;
      case 'scenario_2':
        if (step === 1) return '1. Apache Kafka broker cluster becomes unreachable (network partition or leader election).';
        if (step === 2) return '2. Client payments continue to succeed with HTTP 201 Created (Saved safely to PostgreSQL).';
        if (step === 3) return '3. Outbox table accumulates pending records. OutboxRelayScheduler catches KafkaException and backs off.';
        if (step === 4) return '4. Kafka recovers. Next scheduled relay cycle drains all pending events cleanly in FIFO order.';
        break;
      case 'scenario_3':
        if (step === 1) return '1. Kafka consumer group rebalance occurs; consumer offset commit was delayed.';
        if (step === 2) return '2. Same event (evt_dup_99) delivered a second time to ledger-service.';
        if (step === 3) return '3. Ledger service queries consumed_events table and finds evt_dup_99 already committed.';
        if (step === 4) return '4. Duplicate delivery safely swallowed. Offsets committed. No duplicate ledger lines posted.';
        break;
      case 'scenario_4':
        if (step === 1) return '1. Account balance is $100.00. Two $80.00 debit transactions hit the API at the exact same millisecond.';
        if (step === 2) return '2. Thread A initiates SELECT ... FOR UPDATE, acquiring an exclusive PostgreSQL row lock on the account.';
        if (step === 3) return '3. Thread B attempts to read the same account and is forced to wait on Thread A lock release.';
        if (step === 4) return '4. Thread A debits $80 (balance becomes $20) and commits. Thread B unblocks, reads $20, detects insufficient funds, and rejects. Negative overdraft prevented!';
        break;
      case 'scenario_5':
        if (step === 1) return '1. Malformed JSON payload arrives on payment.events topic.';
        if (step === 2) return '2. Jackson fails deserialization; Spring Kafka initiates exponential retry attempt 1, 2, and 3.';
        if (step === 3) return '3. Retries exhausted. DeadLetterPublishingRecoverer intercepts poison message.';
        if (step === 4) return '4. Message routed to payment.events.DLT with error stack trace header. Partition processing resumes without stall.';
        break;
      case 'scenario_6':
        if (step === 1) return '1. Two related events (Authorize & Settle) published for payment pmt_order_test_88.';
        if (step === 2) return '2. Because aggregateId (pmt_order_test_88) is used as Kafka Record Key, Kafka hash partitions both to the EXACT same partition.';
        if (step === 3) return '3. Kafka consumer reads partition sequentially in strict FIFO order.';
        if (step === 4) return '4. Out-of-order sequencing eliminated by partition key design. Authorization always precedes settlement.';
        break;
      case 'scenario_7':
        if (step === 1) return '1. Kafka consumer polls batch of 10 messages from Kafka topic.';
        if (step === 2) return '2. Messages 1, 2, and 3 processed and committed to PostgreSQL with their event IDs in consumed_events.';
        if (step === 3) return '3. JVM crashes while processing message 4. Kafka offsets were not yet committed.';
        if (step === 4) return '4. Consumer restarts, re-reads all 10 messages. consumed_events skips messages 1, 2, 3 and resumes processing message 4. Exactly-once outcome.';
        break;
      default:
        return 'Ready to simulate.';
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Distributed Reliability
          </span>
          <span className="text-xs text-slate-500 font-medium">Distributed Failure Scenarios & Self-Healing Engine</span>
        </div>
        <h2 className="text-xl font-bold mt-1 text-slate-900">Distributed Failure Scenarios & Resilience</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Step-by-step simulations and Testcontainers unit and integration test blueprints for distributed failure resilience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-2">
            Select Failure Scenario
          </div>

          {failureScenarios.map((scenario) => {
            const isSelected = selectedScenario.id === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setSimStep(0);
                  setIsRunning(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-blue-700 font-semibold">{scenario.tag}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      scenario.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {scenario.severity}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">{scenario.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{scenario.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Detailed Scenario & Simulation Runner (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono text-blue-700 font-semibold uppercase tracking-wider">{selectedScenario.tag}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedScenario.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{selectedScenario.subtitle}</p>
              </div>

              <button
                onClick={runSimulation}
                disabled={isRunning}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-xs whitespace-nowrap self-start"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Simulation...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Visual Simulation</span>
                  </>
                )}
              </button>
            </div>

            {/* Visual Step Simulator */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Simulation Sequence</span>
                <span className="font-mono text-slate-600 text-[11px] font-medium">
                  {simStep === 0 ? 'Click Run to begin' : `Step ${simStep} of 4`}
                </span>
              </div>

              <div className="space-y-2">
                {[1, 2, 3, 4].map((step) => {
                  const isActive = simStep >= step;
                  const isCurrent = simStep === step;
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-lg border text-xs font-mono transition-all flex items-start gap-3 ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold shadow-xs'
                          : isActive
                          ? 'bg-white border-slate-300 text-slate-800'
                          : 'bg-slate-100/60 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {step}
                      </div>
                      <div className="flex-1">
                        {simStep > 0 ? (
                          getStepText(step, selectedScenario.id)
                        ) : (
                          <span className="text-slate-400">Pending simulation trigger...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Root Cause Without This Pattern
                </h4>
                <p className="text-slate-600 leading-relaxed">{selectedScenario.rootCause}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Architectural Mitigation
                </h4>
                <p className="text-slate-600 leading-relaxed">{selectedScenario.mitigation}</p>
              </div>
            </div>

            {/* Architectural Considerations */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Architectural Insights & Design Considerations
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                {selectedScenario.architecturalInsights.map((point, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Automated Test Snippet */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-2 font-medium">
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  Automated Testcontainers Test Blueprint (JUnit 5 + Mockito)
                </span>
                <span className="text-emerald-700 font-semibold">JaCoCo Verified</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto">
                <pre className="text-emerald-400">{selectedScenario.javaTestSnippet}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

package com.bank.recon.service;

import com.bank.recon.dto.*;
import com.bank.recon.entity.ReconAuditLog;
import com.bank.recon.entity.ReconBreak;
import com.bank.recon.entity.ReconRun;
import com.bank.recon.repository.ReconAuditLogRepository;
import com.bank.recon.repository.ReconBreakRepository;
import com.bank.recon.repository.ReconRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class ReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(ReconciliationService.class);

    private final ReconRunRepository runRepository;
    private final ReconBreakRepository breakRepository;
    private final ReconAuditLogRepository auditLogRepository;

    public ReconciliationService(ReconRunRepository runRepository,
                                 ReconBreakRepository breakRepository,
                                 ReconAuditLogRepository auditLogRepository) {
        this.runRepository = runRepository;
        this.breakRepository = breakRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public ReconRunResponse executeReconciliationRun(ReconRunRequest request) {
        String runId = "rcn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        ReconRun run = new ReconRun(runId, request.statementBatchId(), request.statementFileName(), request.currency());
        runRepository.save(run);

        log.info("Starting reconciliation run '{}' for batch '{}'", runId, request.statementBatchId());

        // Simulated external statement feed matching logic
        // In full deployment, this parses the CSV feed and queries the ledger database
        int totalRecords = 50;
        int matchedRecords = 44;
        List<ReconBreak> generatedBreaks = new ArrayList<>();

        // 1. Synthetic Break: Missing in Ledger (Bank settled a charge not present in local ledger)
        generatedBreaks.add(new ReconBreak(
                "brk_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14),
                runId,
                "MISSING_IN_LEDGER",
                "EXT_TX_990182",
                new BigDecimal("350.00"),
                null,
                new BigDecimal("350.00"),
                request.currency()
        ));

        // 2. Synthetic Break: Amount Mismatch (Interchange / clearing fee variance)
        generatedBreaks.add(new ReconBreak(
                "brk_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14),
                runId,
                "AMOUNT_MISMATCH",
                "EXT_TX_881920",
                new BigDecimal("150.00"),
                new BigDecimal("145.00"),
                new BigDecimal("5.00"),
                request.currency()
        ));

        // 3. Synthetic Break: Duplicate Statement Record
        generatedBreaks.add(new ReconBreak(
                "brk_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14),
                runId,
                "DUPLICATE_STATEMENT",
                "EXT_TX_771822",
                new BigDecimal("89.95"),
                new BigDecimal("89.95"),
                BigDecimal.ZERO,
                request.currency()
        ));

        breakRepository.saveAll(generatedBreaks);

        run.setTotalRecords(totalRecords);
        run.setMatchedRecords(matchedRecords);
        run.setBreaksCount(generatedBreaks.size());
        run.setStatus("COMPLETED");
        run.setCompletedAt(Instant.now());
        runRepository.save(run);

        Map<String, Integer> breakSummary = Map.of(
                "MISSING_IN_LEDGER", 1,
                "AMOUNT_MISMATCH", 1,
                "DUPLICATE_STATEMENT", 1
        );

        log.info("Reconciliation run '{}' COMPLETED with {} matched, {} breaks",
                runId, matchedRecords, generatedBreaks.size());

        return new ReconRunResponse(
                runId,
                run.getStatus(),
                run.getTotalRecords(),
                run.getMatchedRecords(),
                run.getBreaksCount(),
                breakSummary,
                run.getExecutedAt()
        );
    }

    public List<BreakResponse> getBreaksByRunId(String runId, String status) {
        List<ReconBreak> breaks = (status != null && !status.isBlank())
                ? breakRepository.findByReconRunIdAndStatus(runId, status)
                : breakRepository.findByReconRunId(runId);

        return breaks.stream()
                .map(b -> new BreakResponse(
                        b.getId(),
                        b.getReconRunId(),
                        b.getBreakType(),
                        b.getStatus(),
                        b.getExternalReference(),
                        b.getStatementAmount(),
                        b.getLedgerAmount(),
                        b.getVarianceAmount(),
                        b.getCurrency(),
                        b.getDetectedAt(),
                        b.getResolvedAt()
                ))
                .toList();
    }

    @Transactional
    public ResolveBreakResponse resolveBreak(String breakId, ResolveBreakRequest request) {
        ReconBreak reconBreak = breakRepository.findById(breakId)
                .orElseThrow(() -> new IllegalArgumentException("Reconciliation break not found: " + breakId));

        if ("RESOLVED".equals(reconBreak.getStatus())) {
            throw new IllegalStateException("Break '" + breakId + "' is already resolved.");
        }

        reconBreak.setStatus("RESOLVED");
        reconBreak.setResolvedAt(Instant.now());
        breakRepository.save(reconBreak);

        // Immutable Append-Only Audit Entry
        String auditId = "adt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        ReconAuditLog auditLog = new ReconAuditLog(
                auditId,
                breakId,
                request.resolutionAction(),
                request.approvedBy(),
                request.justification(),
                request.adjustingLedgerAccount()
        );
        auditLogRepository.save(auditLog);

        log.info("Break '{}' resolved with action '{}' by '{}'. Audit log '{}' committed.",
                breakId, request.resolutionAction(), request.approvedBy(), auditId);

        return new ResolveBreakResponse(
                breakId,
                reconBreak.getStatus(),
                request.resolutionAction(),
                auditId,
                reconBreak.getResolvedAt()
        );
    }
}

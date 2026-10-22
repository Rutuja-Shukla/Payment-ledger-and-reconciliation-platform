package com.bank.recon;

import com.bank.recon.dto.BreakResponse;
import com.bank.recon.dto.ReconRunRequest;
import com.bank.recon.dto.ReconRunResponse;
import com.bank.recon.dto.ResolveBreakRequest;
import com.bank.recon.dto.ResolveBreakResponse;
import com.bank.recon.entity.ReconAuditLog;
import com.bank.recon.repository.ReconAuditLogRepository;
import com.bank.recon.service.ReconciliationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class ReconciliationBreakResolutionTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("recon_db")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ReconciliationService reconciliationService;

    @Autowired
    private ReconAuditLogRepository auditLogRepository;

    @Test
    @DisplayName("GIVEN an external statement WHEN reconciliation executes THEN breaks are recorded AND can be resolved with append-only audit trail")
    void testReconciliationAndAuditTrail() {
        ReconRunRequest runRequest = new ReconRunRequest(
                "BATCH_2026_10_17",
                "bank_chase_feed_20261017.csv",
                "USD",
                null
        );

        ReconRunResponse runResponse = reconciliationService.executeReconciliationRun(runRequest);
        assertThat(runResponse.status()).isEqualTo("COMPLETED");
        assertThat(runResponse.unmatchedBreaksCount()).isGreaterThan(0);

        List<BreakResponse> breaks = reconciliationService.getBreaksByRunId(runResponse.reconRunId(), "UNRESOLVED");
        assertThat(breaks).isNotEmpty();

        BreakResponse breakToResolve = breaks.get(0);

        ResolveBreakRequest resolveRequest = new ResolveBreakRequest(
                "POST_FEE_ADJUSTMENT",
                "Clearing fee variance validated with Chase settlement statement",
                "acc_clearing_fee_expense",
                "operator_auditor_01"
        );

        ResolveBreakResponse resolveResponse = reconciliationService.resolveBreak(breakToResolve.breakId(), resolveRequest);
        assertThat(resolveResponse.status()).isEqualTo("RESOLVED");
        assertThat(resolveResponse.auditLogId()).startsWith("adt_");

        List<ReconAuditLog> auditLogs = auditLogRepository.findByBreakIdOrderByCreatedAtDesc(breakToResolve.breakId());
        assertThat(auditLogs).hasSize(1);
        assertThat(auditLogs.get(0).getOperatorUsername()).isEqualTo("operator_auditor_01");
        assertThat(auditLogs.get(0).getJustification()).contains("Clearing fee variance");
    }
}

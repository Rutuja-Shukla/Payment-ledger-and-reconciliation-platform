package com.bank.recon.repository;

import com.bank.recon.entity.ReconAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReconAuditLogRepository extends JpaRepository<ReconAuditLog, String> {
    List<ReconAuditLog> findByBreakIdOrderByCreatedAtDesc(String breakId);
}

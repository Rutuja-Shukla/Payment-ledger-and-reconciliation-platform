package com.bank.recon.repository;

import com.bank.recon.entity.ReconBreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReconBreakRepository extends JpaRepository<ReconBreak, String> {
    List<ReconBreak> findByReconRunId(String reconRunId);
    List<ReconBreak> findByReconRunIdAndStatus(String reconRunId, String status);
}

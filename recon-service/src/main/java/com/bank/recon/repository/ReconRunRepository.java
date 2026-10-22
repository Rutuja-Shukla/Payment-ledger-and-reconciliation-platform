package com.bank.recon.repository;

import com.bank.recon.entity.ReconRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReconRunRepository extends JpaRepository<ReconRun, String> {
}

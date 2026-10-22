package com.bank.ledger.repository;

import com.bank.ledger.entity.LedgerLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerLineRepository extends JpaRepository<LedgerLine, String> {
    List<LedgerLine> findByAccountId(String accountId);
}

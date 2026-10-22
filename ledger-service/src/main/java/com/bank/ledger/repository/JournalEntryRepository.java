package com.bank.ledger.repository;

import com.bank.ledger.entity.ConsumedEvent;
import com.bank.ledger.entity.JournalEntry;
import com.bank.ledger.entity.LedgerLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, String> {
    Optional<JournalEntry> findByPaymentId(String paymentId);
}

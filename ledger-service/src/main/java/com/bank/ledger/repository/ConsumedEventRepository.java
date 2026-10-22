package com.bank.ledger.repository;

import com.bank.ledger.entity.ConsumedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConsumedEventRepository extends JpaRepository<ConsumedEvent, String> {
    Optional<ConsumedEvent> findByEventIdAndConsumerGroup(String eventId, String consumerGroup);
}

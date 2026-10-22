package com.bank.payment.repository;

import com.bank.payment.entity.IdempotencyKeyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKeyRecord, String> {
    Optional<IdempotencyKeyRecord> findByKey(String key);
}

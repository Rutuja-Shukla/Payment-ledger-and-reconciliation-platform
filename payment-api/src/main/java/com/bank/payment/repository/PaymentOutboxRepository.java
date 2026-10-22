package com.bank.payment.repository;

import com.bank.payment.entity.PaymentOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentOutboxRepository extends JpaRepository<PaymentOutbox, String> {

    @Query("SELECT o FROM PaymentOutbox o WHERE o.status = 'PENDING' ORDER BY o.createdAt ASC")
    List<PaymentOutbox> findPendingRecords(Pageable pageable);
}

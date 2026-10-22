package com.bank.payment.scheduler;

import com.bank.payment.entity.PaymentOutbox;
import com.bank.payment.repository.PaymentOutboxRepository;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Component
public class OutboxRelayScheduler {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelayScheduler.class);
    public static final String PAYMENT_TOPIC = "payment.events";

    private final PaymentOutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxRelayScheduler(PaymentOutboxRepository outboxRepository,
                                 KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxRepository = outboxRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelayString = "${outbox.relay.interval-ms:500}")
    @Transactional
    public void drainOutbox() {
        List<PaymentOutbox> pendingRecords = outboxRepository.findPendingRecords(PageRequest.of(0, 50));
        if (pendingRecords.isEmpty()) {
            return;
        }

        log.debug("Found {} pending outbox records to relay to Kafka", pendingRecords.size());

        for (PaymentOutbox record : pendingRecords) {
            try {
                ProducerRecord<String, String> producerRecord = new ProducerRecord<>(
                        PAYMENT_TOPIC,
                        record.getAggregateId(), // AggregateId as Kafka partition key guarantees ordering
                        record.getPayload()
                );

                if (record.getTraceParent() != null) {
                    producerRecord.headers().add(
                            new RecordHeader("traceparent", record.getTraceParent().getBytes(StandardCharsets.UTF_8))
                    );
                }

                // Synchronous send with timeout to detect broker outages immediately
                kafkaTemplate.send(producerRecord).get(3, java.util.concurrent.TimeUnit.SECONDS);

                record.setStatus("PUBLISHED");
                record.setPublishedAt(Instant.now());
                outboxRepository.save(record);

                log.info("Successfully relayed outbox event '{}' (Payment: {}) to Kafka topic '{}'",
                        record.getId(), record.getAggregateId(), PAYMENT_TOPIC);

            } catch (Exception e) {
                record.incrementRetryCount();
                if (record.getRetryCount() > 10) {
                    record.setStatus("FAILED");
                    log.error("Outbox record '{}' marked FAILED after exceeding max retries", record.getId(), e);
                } else {
                    log.warn("Kafka unavailable or publish failed for outbox '{}' (attempt {}). Outbox will retry on next cycle.",
                            record.getId(), record.getRetryCount(), e);
                }
                outboxRepository.save(record);
                // Break out of the loop if Kafka is down so we don't spam errors for every row in batch
                break;
            }
        }
    }
}

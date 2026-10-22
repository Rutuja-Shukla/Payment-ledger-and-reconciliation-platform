package com.bank.ledger.consumer;

import com.bank.common.event.PaymentInitiatedEvent;
import com.bank.ledger.service.LedgerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.retrytopic.TopicSuffixingStrategy;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventConsumer.class);

    private final LedgerService ledgerService;
    private final ObjectMapper objectMapper;

    public PaymentEventConsumer(LedgerService ledgerService, ObjectMapper objectMapper) {
        this.ledgerService = ledgerService;
        this.objectMapper = objectMapper;
    }

    /**
     * Consumes events from 'payment.events' with automatic retry and dead-letter routing.
     * Retries 3 times with exponential backoff before publishing to 'payment.events.DLT'.
     */
    @RetryableTopic(
            attempts = "3",
            backoff = @Backoff(delay = 1000, multiplier = 2.0),
            topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
            dltTopicSuffix = ".DLT"
    )
    @KafkaListener(
            topics = "payment.events",
            groupId = LedgerService.CONSUMER_GROUP,
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumePaymentEvent(ConsumerRecord<String, String> record) {
        log.info("Received Kafka message key='{}', offset={}, partition={}",
                record.key(), record.offset(), record.partition());

        try {
            PaymentInitiatedEvent event = objectMapper.readValue(record.value(), PaymentInitiatedEvent.class);
            ledgerService.processPaymentEvent(event);
        } catch (Exception e) {
            log.error("Failed to process payment event from partition {} at offset {}. Will retry or route to DLT.",
                    record.partition(), record.offset(), e);
            throw new RuntimeException("Error processing Kafka message", e);
        }
    }

    /**
     * DLT Handler: Receives poison pill messages that could not be parsed or processed.
     */
    @DltHandler
    public void handleDeadLetterMessage(
            ConsumerRecord<String, String> record,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(name = KafkaHeaders.EXCEPTION_MESSAGE, required = false) String exceptionMessage) {

        log.error("🚨 POISON PILL ALERT: Message diverted to Dead-Letter Topic: '{}'. Key='{}'. Error='{}'. Payload: {}",
                topic, record.key(), exceptionMessage, record.value());
    }
}

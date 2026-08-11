-- WhatsApp inbound conversation state (v1.0: dealers have no login portal, WhatsApp is their
-- only channel, so a conversation-state machine is required to interpret replies contextually).

CREATE TABLE `whatsapp_conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dealer_id` BIGINT UNSIGNED NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `state` ENUM('idle','awaiting_quotation_price','awaiting_quotation_confirmation','awaiting_work_order_ack','awaiting_dispatch_details','awaiting_delivery_confirmation') NOT NULL DEFAULT 'idle',
  `context_data` JSON NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` BIGINT UNSIGNED NULL,
  `last_inbound_at` DATETIME(3) NULL,
  `last_outbound_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_whatsappconv_dealer` (`dealer_id`),
  INDEX `idx_whatsappconv_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `whatsapp_inbound_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NULL,
  `provider_message_id` VARCHAR(100) NOT NULL,
  `from_phone` VARCHAR(20) NOT NULL,
  `message_type` VARCHAR(30) NOT NULL,
  `body_text` TEXT NULL,
  `raw_payload` JSON NOT NULL,
  `processed_at` DATETIME(3) NULL,
  `processing_error` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_whatsappinbound_providermsgid` (`provider_message_id`),
  INDEX `idx_whatsappinbound_fromphone` (`from_phone`),
  INDEX `idx_whatsappinbound_processedat` (`processed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `whatsapp_conversations`
  ADD CONSTRAINT `fk_whatsappconv_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `dealers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `whatsapp_inbound_messages`
  ADD CONSTRAINT `fk_whatsappinbound_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `whatsapp_conversations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

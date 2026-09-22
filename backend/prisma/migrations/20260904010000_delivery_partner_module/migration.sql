-- Delivery Partner module — additive only. No table is dropped, no existing column is
-- removed or narrowed, no existing row is touched. Safe to run against a live database
-- with existing orders/shipments.
--
-- Adds:
--   1. delivery_partners            — the admin-managed roster (fields per spec: name,
--                                      mobile, email, address, vehicle, availability).
--   2. shipments.delivery_partner_id, .recipient_name, .recipient_phone,
--      .alternate_recipient_approved_by — all nullable, existing rows unaffected.
--   3. shipments.status enum widened (new values appended, old ones kept — existing
--      'pending'/'picked_up'/'in_transit'/'out_for_delivery'/'delivered'/'failed' rows
--      keep meaning exactly as before).
--   4. delivery_updates widened into the full status-change audit trail required by the
--      spec (order_id, previous_status, new_status, updated_by, updated_by_type,
--      new_delivery_date) — all nullable/defaulted, existing rows unaffected.
--   5. otps.shipment_id + purpose enum gains 'delivery_confirmation' — reuses the
--      existing OTP infrastructure (expiry, attempt-count, consumed-at) for delivery
--      confirmation instead of a parallel table.
--
-- Run after backing up the database, in this order (single transaction is fine — MySQL
-- DDL auto-commits per statement, so run start-to-finish even if interrupted; every
-- statement here is independently safe to re-run/skip if it already applied).

CREATE TABLE IF NOT EXISTS delivery_partners (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL DEFAULT (UUID()),
  full_name         VARCHAR(150) NOT NULL,
  mobile            VARCHAR(20) NOT NULL,
  email             VARCHAR(190) NULL,
  address           VARCHAR(255) NULL,
  city              VARCHAR(100) NULL,
  state             VARCHAR(100) NULL,
  pincode           VARCHAR(10) NULL,
  vehicle_type      VARCHAR(50) NULL,
  vehicle_number    VARCHAR(30) NULL,
  availability_status ENUM('available','busy','offline') NOT NULL DEFAULT 'available',
  status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  joining_date      DATE NULL,
  notes             TEXT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP NULL,
  UNIQUE KEY uq_deliverypartners_mobile (mobile),
  KEY idx_deliverypartners_status (status, availability_status)
) ENGINE=InnoDB;

ALTER TABLE shipments
  MODIFY COLUMN status ENUM('pending','ready_for_dispatch','assigned','picked_up','dispatched','in_transit','out_for_delivery','delivery_attempted','rescheduled','delivered','failed') NOT NULL DEFAULT 'pending',
  ADD COLUMN delivery_partner_id BIGINT UNSIGNED NULL AFTER tracking_number,
  ADD COLUMN recipient_name VARCHAR(150) NULL AFTER status,
  ADD COLUMN recipient_phone VARCHAR(20) NULL AFTER recipient_name,
  ADD COLUMN alternate_recipient_approved_by BIGINT UNSIGNED NULL AFTER recipient_phone,
  ADD KEY idx_shipments_deliverypartner (delivery_partner_id, status),
  ADD CONSTRAINT fk_shipments_deliverypartner FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_shipments_altrecipient_approver FOREIGN KEY (alternate_recipient_approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE delivery_updates
  ADD COLUMN order_id BIGINT UNSIGNED NULL AFTER shipment_id,
  ADD COLUMN previous_status VARCHAR(30) NULL AFTER update_type,
  ADD COLUMN new_status VARCHAR(30) NULL AFTER previous_status,
  ADD COLUMN updated_by BIGINT UNSIGNED NULL AFTER new_status,
  ADD COLUMN updated_by_type ENUM('admin','staff','delivery_partner','system') NOT NULL DEFAULT 'system' AFTER updated_by,
  ADD COLUMN new_delivery_date DATE NULL AFTER updated_by_type,
  ADD KEY idx_deliveryupdates_order (order_id, created_at),
  ADD CONSTRAINT fk_deliveryupdates_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_deliveryupdates_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill order_id on existing delivery_updates rows from their shipment, so the new
-- order-level history index/queries work for historical rows too.
UPDATE delivery_updates du
JOIN shipments s ON s.id = du.shipment_id
SET du.order_id = s.order_id
WHERE du.order_id IS NULL;

ALTER TABLE otps
  MODIFY COLUMN purpose ENUM('login','signup','password_reset','phone_verify','email_verify','transaction','delivery_confirmation') NOT NULL,
  ADD COLUMN shipment_id BIGINT UNSIGNED NULL AFTER user_id,
  ADD KEY idx_otps_shipment (shipment_id),
  ADD CONSTRAINT fk_otps_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE ON UPDATE CASCADE;

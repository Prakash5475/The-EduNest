-- Additive only — no table dropped, no existing column narrowed/removed, no existing row
-- touched (every new column is nullable or has a safe default so existing invoice/inventory
-- rows remain valid as-is).
--
-- 1. products.tax_id -> taxes.id already existed as a deferred FK in
--    edunest_database_schema.sql; it just wasn't declared as a Prisma relation on
--    Product/Tax. That's a schema.prisma-only change (no DDL) and needs no migration here.
--
-- 2. invoices gains persisted CGST/SGST/UTGST/IGST + place of supply + seller/buyer GSTIN
--    snapshots. Previously this breakdown was computed only for the PDF and discarded —
--    never written to SQL — so the GST report had no invoice-level source of truth to read
--    from. Existing invoices get 0 for the new tax columns (backfilled below from the flat
--    tax_amount as a same-state CGST+SGST split, since that's what generateInvoice() always
--    assumed before this fix — this is an approximation for historical rows only; every
--    invoice issued after this migration gets the real computed breakdown).
--
-- 3. New: eway_bills (record-keeping only — no government/IRP API integration exists;
--    eway_bill_number is filled in manually, see the model comment in schema.prisma).
--
-- 4. New: warehouses + inventory.warehouse_id (nullable, additive alongside the existing
--    warehouse_location text column — see the SQL file comment for why the old column is
--    kept rather than migrated away).
--
-- 5. New: quantity_change_requests — approval-gated stock quantity edits. Approving a
--    request updates inventory.quantity_available and writes a stock_history 'adjustment'
--    row in the same transaction (application-layer, see quantityChangeRequest.service.ts —
--    stock_history can't have a DB-level FK because it's a partitioned table, same
--    constraint noted for its other columns in the base schema).

ALTER TABLE invoices
  ADD COLUMN cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER tax_amount,
  ADD COLUMN sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER cgst_amount,
  ADD COLUMN utgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER sgst_amount,
  ADD COLUMN igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER utgst_amount,
  ADD COLUMN is_inter_state TINYINT(1) NOT NULL DEFAULT 0 AFTER igst_amount,
  ADD COLUMN place_of_supply VARCHAR(100) NULL AFTER is_inter_state,
  ADD COLUMN seller_gstin VARCHAR(15) NULL AFTER place_of_supply,
  ADD COLUMN buyer_gstin VARCHAR(15) NULL AFTER seller_gstin;

-- Best-effort backfill for existing invoices only (assumes same-state CGST+SGST, which was
-- the only case generateInvoice() ever priced correctly before the UTGST fix). Safe to skip
-- or re-run: it only touches rows where cgst/sgst/igst are all still their 0 default.
UPDATE invoices
SET cgst_amount = ROUND(tax_amount / 2, 2),
    sgst_amount = tax_amount - ROUND(tax_amount / 2, 2)
WHERE cgst_amount = 0 AND sgst_amount = 0 AND utgst_amount = 0 AND igst_amount = 0 AND tax_amount > 0;

CREATE TABLE IF NOT EXISTS eway_bills (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL DEFAULT (UUID()),
  order_id          BIGINT UNSIGNED NOT NULL,
  invoice_id        BIGINT UNSIGNED NULL,
  eway_bill_number  VARCHAR(20) NULL,
  transporter_name  VARCHAR(150) NULL,
  transporter_gstin VARCHAR(15) NULL,
  transport_mode    ENUM('road','rail','air','ship') NOT NULL DEFAULT 'road',
  vehicle_number    VARCHAR(20) NULL,
  distance_km       INT UNSIGNED NULL,
  status            ENUM('draft','generated','cancelled','expired') NOT NULL DEFAULT 'draft',
  valid_from        TIMESTAMP NULL,
  valid_until       TIMESTAMP NULL,
  created_by        BIGINT UNSIGNED NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ewaybills_number (eway_bill_number),
  KEY idx_ewaybills_order (order_id),
  CONSTRAINT fk_ewaybills_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ewaybills_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ewaybills_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS warehouses (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  name          VARCHAR(150) NOT NULL,
  location      VARCHAR(255) NULL,
  city          VARCHAR(100) NULL,
  state         VARCHAR(100) NULL,
  pincode       VARCHAR(10) NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_warehouses_name (name)
) ENGINE=InnoDB;

ALTER TABLE inventory
  ADD COLUMN warehouse_id BIGINT UNSIGNED NULL AFTER dealer_id,
  ADD KEY idx_inventory_warehouse (warehouse_id),
  ADD CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS quantity_change_requests (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid                CHAR(36) NOT NULL DEFAULT (UUID()),
  inventory_id        BIGINT UNSIGNED NOT NULL,
  current_quantity    INT NOT NULL,
  requested_quantity  INT NOT NULL,
  reason              VARCHAR(500) NOT NULL,
  status              ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  requested_by        BIGINT UNSIGNED NOT NULL,
  requested_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_by          BIGINT UNSIGNED NULL,
  decided_at          TIMESTAMP NULL,
  rejection_reason    VARCHAR(500) NULL,
  KEY idx_qtychangereq_inventory (inventory_id, status),
  KEY idx_qtychangereq_status (status, requested_at),
  CONSTRAINT fk_qtychangereq_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qtychangereq_requester FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_qtychangereq_decider FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_qtychangereq_qty CHECK (requested_quantity >= 0)
) ENGINE=InnoDB;

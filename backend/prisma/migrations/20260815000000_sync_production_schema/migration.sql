-- EduNest production schema alignment
-- Safe migration for the approved dealer-dashboard quotation workflow.
-- No WhatsApp tables are created by this migration.

-- 1) Custom quotation item metadata/pricing.
ALTER TABLE `quotation_request_products`
  ADD COLUMN `custom_item_name` VARCHAR(220) NULL AFTER `kit_id`,
  ADD COLUMN `custom_item_school_price` DECIMAL(12,2) NULL AFTER `custom_item_description`,
  ADD COLUMN `custom_item_dealer_price` DECIMAL(12,2) NULL AFTER `custom_item_school_price`,
  ADD COLUMN `custom_item_image_file_id` BIGINT UNSIGNED NULL AFTER `custom_item_dealer_price`,
  ADD COLUMN `custom_item_external_url` VARCHAR(500) NULL AFTER `custom_item_image_file_id`,
  ADD COLUMN `custom_item_notes` TEXT NULL AFTER `custom_item_external_url`;

ALTER TABLE `quotation_request_products`
  ADD CONSTRAINT `fk_quotreqprod_image`
  FOREIGN KEY (`custom_item_image_file_id`) REFERENCES `uploaded_files`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Dealer quotation pricing split.
ALTER TABLE `dealer_quotation_items`
  ADD COLUMN `school_unit_price` DECIMAL(12,2) NULL AFTER `quoted_unit_price`,
  ADD COLUMN `dealer_unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `school_unit_price`;

-- Existing quoted_unit_price is the dealer's quoted price in the legacy model.
UPDATE `dealer_quotation_items`
SET `dealer_unit_price` = `quoted_unit_price`
WHERE `dealer_unit_price` = 0;

-- Derive school price where it is deterministic from the requested catalog product.
UPDATE `dealer_quotation_items` dqi
JOIN `quotation_request_products` qrp
  ON qrp.id = dqi.quotation_request_product_id
LEFT JOIN `products` p
  ON p.id = qrp.product_id
SET dqi.school_unit_price = CASE
  WHEN qrp.custom_item_school_price IS NOT NULL THEN qrp.custom_item_school_price
  WHEN p.base_price IS NOT NULL THEN p.base_price
  ELSE NULL
END
WHERE dqi.school_unit_price IS NULL;

-- 3) Order financial breakdown.
ALTER TABLE `orders`
  ADD COLUMN `dealer_total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `total_amount`,
  ADD COLUMN `margin_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `dealer_total_amount`,
  ADD COLUMN `platform_fee_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `margin_amount`,
  ADD COLUMN `net_revenue_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `platform_fee_amount`;

-- 4) Dealer unit price on order lines. Historical orders do not have a reliable
-- dealer price, so use the recorded school/unit price rather than inventing a margin.
ALTER TABLE `order_items`
  ADD COLUMN `dealer_unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `unit_price`;

UPDATE `order_items`
SET `dealer_unit_price` = `unit_price`
WHERE `dealer_unit_price` = 0;

UPDATE `orders` o
LEFT JOIN (
  SELECT order_id, SUM(dealer_unit_price * quantity) AS dealer_total
  FROM order_items
  GROUP BY order_id
) oi ON oi.order_id = o.id
SET o.dealer_total_amount = COALESCE(oi.dealer_total, 0.00),
    o.margin_amount = o.subtotal - COALESCE(oi.dealer_total, 0.00),
    o.platform_fee_amount = 0.00,
    o.net_revenue_amount = o.subtotal - COALESCE(oi.dealer_total, 0.00);

-- 5) Immutable production audit actor type.
ALTER TABLE `production_checkpoints`
  ADD COLUMN `updated_by_type` ENUM('dealer','admin','system') NOT NULL DEFAULT 'system' AFTER `updated_by`;

UPDATE `production_checkpoints` pc
SET pc.updated_by_type = CASE
  WHEN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = pc.updated_by
      AND r.slug = 'dealer'
      AND r.deleted_at IS NULL
  ) THEN 'dealer'
  WHEN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = pc.updated_by
      AND r.slug IN ('super_admin','staff','admin')
      AND r.deleted_at IS NULL
  ) THEN 'admin'
  ELSE 'system'
END
WHERE pc.updated_by IS NOT NULL;

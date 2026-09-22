-- Seeds the company's GST-registration profile into `application_settings`.
-- Safe/additive: only inserts rows if they don't already exist (an admin who has already
-- edited these via Admin Settings > Company/GST is never overwritten). No destructive
-- statements, no schema changes.
--
-- Source: GST certificate supplied for "The EduNest" (GSTIN 27CIEP38036K1ZY).

INSERT INTO `application_settings` (`setting_key`, `setting_value`, `value_type`, `updated_at`)
VALUES
  ('company_legal_name', 'MADHAV TIRUPATI JAYBHAYE', 'string', NOW()),
  ('company_trade_name', 'The EduNest', 'string', NOW()),
  ('company_gstin', '27CIEP38036K1ZY', 'string', NOW()),
  ('company_constitution', 'Proprietorship', 'string', NOW()),
  ('company_gst_registration_type', 'Regular', 'string', NOW()),
  ('company_gst_registration_date', '2026-01-07', 'string', NOW()),
  ('company_gst_address_line1', 'Office No. 101, Guru Krupa Sewa Aashram Road', 'string', NOW()),
  ('company_gst_address_line2', 'Momin Apartments, Wagholi Awhadi Road', 'string', NOW()),
  ('company_gst_locality', 'Wagholi', 'string', NOW()),
  ('company_gst_city', 'Pune', 'string', NOW()),
  ('company_gst_district', 'Pune', 'string', NOW()),
  ('company_gst_state', 'Maharashtra', 'string', NOW()),
  ('company_gst_pincode', '412207', 'string', NOW())
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- The Prisma model and production checkpoint write path include override_reason,
-- but the original production schema and sync migration omitted this nullable field.
-- Additive only: existing checkpoint rows remain unchanged.
ALTER TABLE `production_checkpoints`
  ADD COLUMN `override_reason` VARCHAR(500) NULL AFTER `updated_by_type`;
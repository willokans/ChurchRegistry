-- Add other_names to baptisms and enforce unique (parish_id, baptism_name, other_names, surname).
-- Run after 002_baptism_officiating_priest.sql.
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS other_names TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_baptisms_parish_name_unique
  ON baptisms (parish_id, baptism_name, other_names, surname);

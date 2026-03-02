-- Add officiating priest to baptisms (run after 001_initial_schema.sql).
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS officiating_priest TEXT NOT NULL DEFAULT '';

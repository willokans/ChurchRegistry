-- Add optional note to baptisms (for additional notes on the record).
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS note TEXT;

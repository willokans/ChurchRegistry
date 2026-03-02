-- Add created_at timestamps for monthly dashboard aggregation by record creation time.
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE communions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE confirmations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

UPDATE baptisms SET created_at = now() WHERE created_at IS NULL;
UPDATE communions SET created_at = now() WHERE created_at IS NULL;
UPDATE confirmations SET created_at = now() WHERE created_at IS NULL;
UPDATE marriages SET created_at = now() WHERE created_at IS NULL;

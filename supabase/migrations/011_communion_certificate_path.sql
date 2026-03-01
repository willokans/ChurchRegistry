-- Store path/URL of uploaded Holy Communion certificate (when communion was in another church).
ALTER TABLE communions ADD COLUMN IF NOT EXISTS communion_certificate_path TEXT;

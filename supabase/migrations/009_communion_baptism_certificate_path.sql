-- Store path/URL of uploaded baptism certificate for communions (when baptism was in another parish).
ALTER TABLE communions ADD COLUMN IF NOT EXISTS baptism_certificate_path TEXT;

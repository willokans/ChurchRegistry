-- Add Place of Birth, Place of Baptism, Date of Baptism, Liber No. to baptisms (for certificate enhancement).
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255);
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS place_of_baptism VARCHAR(255);
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS date_of_baptism DATE;
ALTER TABLE baptisms ADD COLUMN IF NOT EXISTS liber_no VARCHAR(50);

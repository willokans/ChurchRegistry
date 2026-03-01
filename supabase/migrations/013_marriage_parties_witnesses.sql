-- Extend marriages for full Create Marriage flow: groom/bride with link-or-upload per sacrament, witnesses.
-- Existing marriages keep baptism_id, communion_id, confirmation_id; new records use marriage_parties.

-- Allow marriages without single-chain FKs when using marriage_parties
ALTER TABLE marriages ALTER COLUMN baptism_id DROP NOT NULL;
ALTER TABLE marriages ALTER COLUMN communion_id DROP NOT NULL;
ALTER TABLE marriages ALTER COLUMN confirmation_id DROP NOT NULL;

-- Marriage details (mock: Marriage Details section)
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS marriage_time TIME;
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS church_name TEXT;
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS marriage_register TEXT;
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS diocese TEXT;
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS civil_registry_number TEXT;
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS dispensation_granted BOOLEAN;
ALTER TABLE marriages ADD COLUMN IF NOT EXISTS canonical_notes TEXT;

-- Groom/Bride: personal info + sacrament link or certificate path per sacrament
CREATE TABLE IF NOT EXISTS marriage_parties (
  id SERIAL PRIMARY KEY,
  marriage_id INTEGER NOT NULL REFERENCES marriages(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('GROOM', 'BRIDE')),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  place_of_birth TEXT,
  nationality TEXT,
  residential_address TEXT,
  phone TEXT,
  email TEXT,
  occupation TEXT,
  marital_status TEXT,
  -- Link to parish record (when sacrament in this parish)
  baptism_id INTEGER REFERENCES baptisms(id) ON DELETE SET NULL,
  communion_id INTEGER REFERENCES communions(id) ON DELETE SET NULL,
  confirmation_id INTEGER REFERENCES confirmations(id) ON DELETE SET NULL,
  -- Certificate path when sacrament elsewhere
  baptism_certificate_path TEXT,
  communion_certificate_path TEXT,
  confirmation_certificate_path TEXT,
  -- Optional church names when external
  baptism_church TEXT,
  communion_church TEXT,
  confirmation_church TEXT
);
CREATE INDEX IF NOT EXISTS idx_marriage_parties_marriage_id ON marriage_parties(marriage_id);

-- Witnesses (minimum 2)
CREATE TABLE IF NOT EXISTS marriage_witnesses (
  id SERIAL PRIMARY KEY,
  marriage_id INTEGER NOT NULL REFERENCES marriages(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  signature_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_marriage_witnesses_marriage_id ON marriage_witnesses(marriage_id);

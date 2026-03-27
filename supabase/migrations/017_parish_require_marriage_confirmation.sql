-- Parish policy: whether Confirmation must be linked when creating a marriage (default: required).
ALTER TABLE parishes ADD COLUMN IF NOT EXISTS require_marriage_confirmation BOOLEAN NOT NULL DEFAULT true;

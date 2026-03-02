-- App users for Church Registry login (Priest, Secretary, Admin only).
-- Passwords stored as bcrypt hashes; use a seed migration or script to insert users.

CREATE TABLE app_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('PRIEST', 'SECRETARY', 'ADMIN')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_app_users_email ON app_users (LOWER(email));

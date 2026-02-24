-- Church Registry – initial schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor for both staging and production projects.
-- Column names use snake_case; your app layer will map to camelCase for the API.

-- Dioceses
CREATE TABLE dioceses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Parishes
CREATE TABLE parishes (
  id SERIAL PRIMARY KEY,
  diocese_id INTEGER NOT NULL REFERENCES dioceses(id) ON DELETE CASCADE,
  parish_name TEXT NOT NULL,
  description TEXT
);
CREATE INDEX idx_parishes_diocese_id ON parishes(diocese_id);

-- Baptisms
CREATE TABLE baptisms (
  id SERIAL PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes(id) ON DELETE CASCADE,
  baptism_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  fathers_name TEXT NOT NULL,
  mothers_name TEXT NOT NULL,
  sponsor_names TEXT NOT NULL,
  address TEXT,
  parish_address TEXT,
  parent_address TEXT
);
CREATE INDEX idx_baptisms_parish_id ON baptisms(parish_id);

-- First Holy Communion
CREATE TABLE communions (
  id SERIAL PRIMARY KEY,
  baptism_id INTEGER NOT NULL REFERENCES baptisms(id) ON DELETE CASCADE,
  communion_date DATE NOT NULL,
  officiating_priest TEXT NOT NULL,
  parish TEXT NOT NULL
);
CREATE INDEX idx_communions_baptism_id ON communions(baptism_id);

-- Confirmation
CREATE TABLE confirmations (
  id SERIAL PRIMARY KEY,
  baptism_id INTEGER NOT NULL REFERENCES baptisms(id) ON DELETE CASCADE,
  communion_id INTEGER NOT NULL REFERENCES communions(id) ON DELETE CASCADE,
  confirmation_date DATE NOT NULL,
  officiating_bishop TEXT NOT NULL,
  parish TEXT
);
CREATE INDEX idx_confirmations_baptism_id ON confirmations(baptism_id);
CREATE INDEX idx_confirmations_communion_id ON confirmations(communion_id);

-- Marriages
CREATE TABLE marriages (
  id SERIAL PRIMARY KEY,
  baptism_id INTEGER NOT NULL REFERENCES baptisms(id) ON DELETE CASCADE,
  communion_id INTEGER NOT NULL REFERENCES communions(id) ON DELETE CASCADE,
  confirmation_id INTEGER NOT NULL REFERENCES confirmations(id) ON DELETE CASCADE,
  partners_name TEXT NOT NULL,
  marriage_date DATE NOT NULL,
  officiating_priest TEXT NOT NULL,
  parish TEXT NOT NULL
);
CREATE INDEX idx_marriages_baptism_id ON marriages(baptism_id);
CREATE INDEX idx_marriages_confirmation_id ON marriages(confirmation_id);

-- Holy Orders
CREATE TABLE holy_orders (
  id SERIAL PRIMARY KEY,
  baptism_id INTEGER NOT NULL REFERENCES baptisms(id) ON DELETE CASCADE,
  communion_id INTEGER NOT NULL REFERENCES communions(id) ON DELETE CASCADE,
  confirmation_id INTEGER NOT NULL REFERENCES confirmations(id) ON DELETE CASCADE,
  ordination_date DATE NOT NULL,
  order_type TEXT NOT NULL,
  officiating_bishop TEXT NOT NULL,
  parish_id INTEGER REFERENCES parishes(id) ON DELETE SET NULL
);
CREATE INDEX idx_holy_orders_baptism_id ON holy_orders(baptism_id);
CREATE INDEX idx_holy_orders_parish_id ON holy_orders(parish_id);

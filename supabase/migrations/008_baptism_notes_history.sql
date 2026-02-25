-- Note history for baptisms (each Save Notes adds an entry).
CREATE TABLE baptism_notes (
  id SERIAL PRIMARY KEY,
  baptism_id INTEGER NOT NULL REFERENCES baptisms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_baptism_notes_baptism_id ON baptism_notes(baptism_id);

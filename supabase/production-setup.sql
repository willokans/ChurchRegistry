-- Production Supabase: Storage bucket setup for Church Registry
-- Run this in Supabase SQL Editor after creating the production project.
-- Do NOT add permissive policies; certificate access goes through Spring API (service role).

-- Baptism certificates (used when registering communion with "Baptism from another Parish")
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('baptism-certificates', 'baptism-certificates', false, 2097152)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

-- Holy Communion certificates (used when communion was in another church)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('communion-certificates', 'communion-certificates', false, 2097152)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

-- Marriage-related certificates (baptism, communion, confirmation for groom/bride)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('marriage-certificates', 'marriage-certificates', false, 2097152)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

-- Create storage bucket for baptism certificates (used when registering communion with "Baptism from another Parish").
-- Private bucket: files are only accessible via signed URLs or with service role.
-- file_size_limit: 2 MB (certificates only; no large documents).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('baptism-certificates', 'baptism-certificates', false, 2097152)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

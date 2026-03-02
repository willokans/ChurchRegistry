-- Create storage bucket for Holy Communion certificates (used when communion was in another church).
-- Run this migration in Supabase (Dashboard → SQL Editor or `supabase db push`) so certificate uploads work.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('communion-certificates', 'communion-certificates', false, 2097152)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

-- Allow uploads and reads for the communion-certificates bucket.
DROP POLICY IF EXISTS "Allow communion certificate uploads" ON storage.objects;
CREATE POLICY "Allow communion certificate uploads"
ON storage.objects FOR ALL
USING (bucket_id = 'communion-certificates')
WITH CHECK (bucket_id = 'communion-certificates');

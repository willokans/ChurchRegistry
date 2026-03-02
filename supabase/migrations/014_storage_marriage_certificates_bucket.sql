-- Storage bucket for marriage-related certificates (baptism, communion, confirmation for groom/bride).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('marriage-certificates', 'marriage-certificates', false, 2097152)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Allow marriage certificate uploads" ON storage.objects;
CREATE POLICY "Allow marriage certificate uploads"
ON storage.objects FOR ALL
USING (bucket_id = 'marriage-certificates')
WITH CHECK (bucket_id = 'marriage-certificates');

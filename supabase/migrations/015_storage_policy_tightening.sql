-- Storage policy tightening: least-privilege access and certificate path controls.
-- All certificate access goes through Spring API (service role), which bypasses RLS.
-- Removing broad policies ensures anon/authenticated users cannot access storage directly.
-- Path format (enforced by app): no '..', safe chars only (alphanumeric, ._-/)
--   - baptism/communion: {timestamp}-{filename}
--   - marriage: {role}-{certificateType}-{timestamp}-{filename}

-- Remove broad policies that allowed any authenticated user full access to buckets.
-- Baptism bucket (010) has no policies; communion (012) and marriage (014) had permissive policies.
DROP POLICY IF EXISTS "Allow communion certificate uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow marriage certificate uploads" ON storage.objects;

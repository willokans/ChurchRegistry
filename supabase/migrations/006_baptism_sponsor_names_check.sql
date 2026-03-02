-- Enforce sponsor_names on baptisms: 1 or 2 sponsors, each with at least first and last name.
-- Format: "FirstName LastName" or "FirstName1 LastName1, FirstName2 LastName2".
-- Run after 003 (baptisms table exists). Supabase uses public schema by default.

CREATE OR REPLACE FUNCTION public.valid_sponsor_names(names TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  entries TEXT[];
  entry TEXT;
  word_count INT;
BEGIN
  IF names IS NULL OR trim(names) = '' THEN
    RETURN FALSE;
  END IF;
  -- Split by comma, trim parts, drop empty
  SELECT array_agg(t)
  INTO entries
  FROM (SELECT trim(unnest(regexp_split_to_array(trim(names), ','))) AS t) AS x
  WHERE t <> '';
  IF entries IS NULL OR array_length(entries, 1) IS NULL THEN
    RETURN FALSE;
  END IF;
  IF array_length(entries, 1) < 1 OR array_length(entries, 1) > 2 THEN
    RETURN FALSE;
  END IF;
  FOREACH entry IN ARRAY entries
  LOOP
    SELECT count(*) INTO word_count
    FROM unnest(regexp_split_to_array(trim(entry), '\s+')) AS w
    WHERE w <> '';
    IF word_count IS NULL OR word_count < 2 THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fix existing rows that do not satisfy the rule (e.g. empty or single name)
UPDATE baptisms
SET sponsor_names = 'Unknown Unknown'
WHERE NOT public.valid_sponsor_names(sponsor_names);

ALTER TABLE baptisms
  ADD CONSTRAINT chk_baptisms_sponsor_names
  CHECK (public.valid_sponsor_names(sponsor_names));

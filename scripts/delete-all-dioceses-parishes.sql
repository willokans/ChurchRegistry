-- Delete all Dioceses and Parishes in Supabase
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Order matters: clear references to parish/diocese before deleting.

BEGIN;

-- 1. Clear parish references (nullable FKs)
UPDATE app_user SET parish_id = NULL WHERE parish_id IS NOT NULL;
UPDATE baptism SET parish_id = NULL WHERE parish_id IS NOT NULL;
UPDATE holy_order SET parish_id = NULL WHERE parish_id IS NOT NULL;

-- 2. app_user_parish_access: CASCADE on parish delete, but explicit delete is clearer
DELETE FROM app_user_parish_access;

-- 3. Priests reference parish (required FK) - must delete before parish
DELETE FROM priest;

-- 4. Delete parishes, then dioceses
DELETE FROM parish;
DELETE FROM diocese;

-- 5. Reset ID sequences for clean numbering on next insert (optional)
SELECT setval(pg_get_serial_sequence('diocese', 'id'), 1);
SELECT setval(pg_get_serial_sequence('parish', 'id'), 1);

COMMIT;

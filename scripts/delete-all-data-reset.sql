-- Delete all sacrament data, dioceses, and parishes. Keeps app_user so you can log in.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor) or: psql $DATABASE_URL -f scripts/delete-all-data-reset.sql
--
-- After running: log in as admin, go to Dioceses & Parishes, add diocese then parish from the frontend.

BEGIN;

-- 1. Sacrament audit log (has immutable trigger - must drop, delete, recreate)
DROP TRIGGER IF EXISTS trg_sacrament_audit_log_immutable ON sacrament_audit_log;
DELETE FROM sacrament_audit_log;
CREATE TRIGGER trg_sacrament_audit_log_immutable
  BEFORE UPDATE OR DELETE ON sacrament_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sacrament_audit_log_mutation();

DELETE FROM sacrament_note_history;

-- 2. Marriage legacy tables (reference marriage)
DELETE FROM marriage_parties;
DELETE FROM marriage_witnesses;

-- 3. Sacraments (order: marriage -> confirmation -> communion -> holy_order -> baptism)
DELETE FROM marriage;
DELETE FROM confirmation;
DELETE FROM first_holy_communion;
DELETE FROM holy_order;
DELETE FROM baptism;

-- 4. Priests (reference parish)
DELETE FROM priest;

-- 5. User parish access
DELETE FROM app_user_parish_access;
UPDATE app_user SET parish_id = NULL WHERE parish_id IS NOT NULL;

-- 6. Parishes and dioceses
DELETE FROM parish;
DELETE FROM diocese;

-- 7. Reset sequences (optional, for clean IDs)
SELECT setval(pg_get_serial_sequence('diocese', 'id'), 1);
SELECT setval(pg_get_serial_sequence('parish', 'id'), 1);
SELECT setval(pg_get_serial_sequence('baptism', 'id'), 1);
SELECT setval(pg_get_serial_sequence('first_holy_communion', 'id'), 1);
SELECT setval(pg_get_serial_sequence('confirmation', 'id'), 1);
SELECT setval(pg_get_serial_sequence('marriage', 'id'), 1);
SELECT setval(pg_get_serial_sequence('holy_order', 'id'), 1);

COMMIT;

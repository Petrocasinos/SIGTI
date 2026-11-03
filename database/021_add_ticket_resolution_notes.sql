BEGIN;

ALTER TABLE test.tickets
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

COMMIT;

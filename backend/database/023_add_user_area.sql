-- Guarda el área organizacional de cada usuario registrado.
BEGIN;

ALTER TABLE test.usuarios
  ADD COLUMN IF NOT EXISTS area TEXT NOT NULL DEFAULT 'ÁREA NO DEFINIDA';

GRANT SELECT, INSERT, UPDATE, DELETE ON test.usuarios TO service_role;

COMMIT;

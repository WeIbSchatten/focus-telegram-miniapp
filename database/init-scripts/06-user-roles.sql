-- Replace single role with roles array (comma-separated for TypeORM simple-array).
-- Run after focus-service is stopped or before first deploy with new code.

ALTER TABLE users ADD COLUMN IF NOT EXISTS roles VARCHAR(500);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'role') THEN
    UPDATE users SET roles = role::text WHERE roles IS NULL OR roles = '';
    ALTER TABLE users DROP COLUMN role;
  END IF;
END $$;

ALTER TABLE users ALTER COLUMN roles SET DEFAULT 'user';

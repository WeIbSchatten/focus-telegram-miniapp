-- Add max_attempts to tests (NULL = unlimited)
ALTER TABLE tests ADD COLUMN IF NOT EXISTS max_attempts INTEGER NULL;

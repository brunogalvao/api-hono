-- Archived duplicate migration.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

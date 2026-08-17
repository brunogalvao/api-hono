ALTER TABLE workspace_invites
  ADD COLUMN IF NOT EXISTS permissions jsonb;;

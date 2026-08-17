ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS access_expenses boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_incomes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_installments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_advisor boolean NOT NULL DEFAULT true;

ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS access_expenses boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_incomes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_installments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_advisor boolean NOT NULL DEFAULT true;;

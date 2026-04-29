-- Adiciona nome e telefone ao convite para personalizar o e-mail
-- e pré-preencher o perfil quando o convidado aceitar.
ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS name  text,
  ADD COLUMN IF NOT EXISTS phone text;

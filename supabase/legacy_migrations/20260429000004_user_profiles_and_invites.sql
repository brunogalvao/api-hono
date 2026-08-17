-- Archived duplicate migration. ─── user_profiles ─────────────────────────────
-- Espelho público de auth.users para exibir avatar e nome de membros do grupo.
CREATE TABLE IF NOT EXISTS user_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  email        text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE user_profiles TO authenticated;

-- Qualquer membro autenticado pode ler perfis (nome/avatar são info pública no contexto do grupo)
CREATE POLICY "authenticated_read_profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

-- Trigger: sincroniza após INSERT ou UPDATE em auth.users
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'displayName',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url   = EXCLUDED.avatar_url,
    email        = EXCLUDED.email,
    updated_at   = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sync_profile ON auth.users;

CREATE TRIGGER on_auth_user_sync_profile
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile();

-- ─── invites ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invites (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  token        uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  accepted_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_token    ON invites (token);
CREATE INDEX IF NOT EXISTS idx_invites_group_id ON invites (group_id);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE invites TO authenticated;

-- Owner do grupo pode criar convites
CREATE POLICY "owner_create_invite" ON invites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id       = invites.group_id
        AND g.owner_id = auth.uid()
    )
  );

-- Membros do grupo veem os convites do grupo
CREATE POLICY "members_read_invites" ON invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = invites.group_id
        AND gm.user_id  = auth.uid()
    )
  );

-- Leitura pública por token (para a página de aceite sem login)
-- Usada via service role no endpoint público — não precisa de policy anon aqui.
-- O endpoint /api/invite/:token usa service role para validar o token.

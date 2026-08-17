-- Tabela de grupos/workspaces
CREATE TABLE IF NOT EXISTS groups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  type       text        NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'shared')),
  owner_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Membros de cada grupo
CREATE TABLE IF NOT EXISTS group_members (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Índices para as queries de RLS
CREATE INDEX IF NOT EXISTS idx_group_members_user_id  ON group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id        ON groups (owner_id);

-- RLS
ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Grants para o role authenticated (necessário ao usar anon key + JWT)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE groups        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE group_members TO authenticated;

-- groups: membro pode ver seus próprios grupos
CREATE POLICY "authenticated_see_own_groups" ON groups
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id  = auth.uid()
    )
  );

-- groups: owner pode atualizar o grupo
CREATE POLICY "owner_update_group" ON groups
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- group_members: membros veem todos do mesmo grupo
CREATE POLICY "members_see_group_roster" ON group_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id  = auth.uid()
    )
  );

-- group_members: owner pode adicionar/remover membros
CREATE POLICY "owner_manage_members" ON group_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id       = group_members.group_id
        AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id       = group_members.group_id
        AND g.owner_id = auth.uid()
    )
  );;

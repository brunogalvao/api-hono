-- Archived duplicate migration. Adiciona group_id às tabelas existentes (nullable para backfill)
ALTER TABLE tasks   ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);

-- ─── Backfill ─────────────────────────────────────────────────────────────────
-- Cria um grupo pessoal para cada usuário com tasks ou incomes existentes,
-- adiciona o usuário como owner, e vincula seus registros ao grupo.

DO $$
DECLARE
  rec        RECORD;
  new_gid    uuid;
BEGIN
  FOR rec IN
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM tasks   WHERE user_id IS NOT NULL
      UNION
      SELECT user_id FROM incomes WHERE user_id IS NOT NULL
    ) all_users
  LOOP
    -- Cria grupo pessoal
    INSERT INTO groups (name, type, owner_id)
    VALUES ('Pessoal', 'personal', rec.user_id)
    RETURNING id INTO new_gid;

    -- Adiciona como owner
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (new_gid, rec.user_id, 'owner');

    -- Vincula tasks ao grupo
    UPDATE tasks
    SET group_id = new_gid
    WHERE user_id = rec.user_id AND group_id IS NULL;

    -- Vincula incomes ao grupo
    UPDATE incomes
    SET group_id = new_gid
    WHERE user_id = rec.user_id AND group_id IS NULL;
  END LOOP;
END $$;

-- Agora que o backfill está completo, torna group_id obrigatório
ALTER TABLE tasks   ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE incomes ALTER COLUMN group_id SET NOT NULL;

-- Índice para as queries de RLS
CREATE INDEX IF NOT EXISTS idx_tasks_group_id   ON tasks   (group_id);
CREATE INDEX IF NOT EXISTS idx_incomes_group_id ON incomes (group_id);

-- ─── Grants (para anon key + JWT / role authenticated) ────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE incomes TO authenticated;

-- ─── RLS tasks ────────────────────────────────────────────────────────────────
-- Remove policies abertas criadas na migration inicial
DROP POLICY IF EXISTS "Todos podem ler tarefas"       ON tasks;
DROP POLICY IF EXISTS "Todos podem criar tarefas"     ON tasks;
DROP POLICY IF EXISTS "Todos podem atualizar tarefas" ON tasks;
DROP POLICY IF EXISTS "Todos podem deletar tarefas"   ON tasks;

-- Novas policies: acesso via pertencimento ao grupo
CREATE POLICY "group_members_select_tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = tasks.group_id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE POLICY "group_members_insert_tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = tasks.group_id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE POLICY "group_members_update_tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = tasks.group_id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE POLICY "group_members_delete_tasks" ON tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = tasks.group_id
        AND gm.user_id  = auth.uid()
    )
  );

-- ─── RLS incomes ──────────────────────────────────────────────────────────────
-- Habilita RLS caso ainda não esteja ativo
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Remove qualquer policy aberta que possa existir
DROP POLICY IF EXISTS "Todos podem ler incomes"       ON incomes;
DROP POLICY IF EXISTS "Todos podem criar incomes"     ON incomes;
DROP POLICY IF EXISTS "Todos podem atualizar incomes" ON incomes;
DROP POLICY IF EXISTS "Todos podem deletar incomes"   ON incomes;

CREATE POLICY "group_members_select_incomes" ON incomes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = incomes.group_id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE POLICY "group_members_insert_incomes" ON incomes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = incomes.group_id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE POLICY "group_members_update_incomes" ON incomes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = incomes.group_id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE POLICY "group_members_delete_incomes" ON incomes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = incomes.group_id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = target_group_id
      AND gm.user_id = COALESCE(target_user_id, auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(target_group_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = target_group_id
      AND g.owner_id = COALESCE(target_user_id, auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "authenticated_see_own_groups" ON groups;
DROP POLICY IF EXISTS "owner_update_group" ON groups;
DROP POLICY IF EXISTS "members_see_group_roster" ON group_members;
DROP POLICY IF EXISTS "owner_manage_members" ON group_members;
DROP POLICY IF EXISTS "members_read_invites" ON invites;
DROP POLICY IF EXISTS "owner_create_invite" ON invites;
DROP POLICY IF EXISTS "group_members_select_tasks" ON tasks;
DROP POLICY IF EXISTS "group_members_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "group_members_update_tasks" ON tasks;
DROP POLICY IF EXISTS "group_members_delete_tasks" ON tasks;
DROP POLICY IF EXISTS "group_members_select_incomes" ON incomes;
DROP POLICY IF EXISTS "group_members_insert_incomes" ON incomes;
DROP POLICY IF EXISTS "group_members_update_incomes" ON incomes;
DROP POLICY IF EXISTS "group_members_delete_incomes" ON incomes;

CREATE POLICY "authenticated_see_own_groups" ON groups
  FOR SELECT TO authenticated
  USING (public.is_group_member(id));

CREATE POLICY "owner_update_group" ON groups
  FOR UPDATE TO authenticated
  USING (public.is_group_owner(id));

CREATE POLICY "members_see_group_roster" ON group_members
  FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY "owner_manage_members" ON group_members
  FOR ALL TO authenticated
  USING (public.is_group_owner(group_id))
  WITH CHECK (public.is_group_owner(group_id));

CREATE POLICY "members_read_invites" ON invites
  FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY "owner_create_invite" ON invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_owner(group_id));

CREATE POLICY "group_members_select_tasks" ON tasks
  FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY "group_members_insert_tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "group_members_update_tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (public.is_group_member(group_id))
  WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "group_members_delete_tasks" ON tasks
  FOR DELETE TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY "group_members_select_incomes" ON incomes
  FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY "group_members_insert_incomes" ON incomes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "group_members_update_incomes" ON incomes
  FOR UPDATE TO authenticated
  USING (public.is_group_member(group_id))
  WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "group_members_delete_incomes" ON incomes
  FOR DELETE TO authenticated
  USING (public.is_group_member(group_id));

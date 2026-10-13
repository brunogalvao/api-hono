-- Create additional workspaces through a service-role-only, transactional RPC.
-- The API supplies the authenticated actor id; browsers cannot execute this RPC.

create or replace function private.create_workspace_core(
  p_actor_id uuid,
  p_name text,
  p_max_workspaces integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_workspace public.workspaces%rowtype;
begin
  if p_actor_id is null then
    raise exception 'unauthorized';
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 60 then
    raise exception 'invalid_workspace_name';
  end if;

  if p_max_workspaces < 1 or p_max_workspaces > 100 then
    raise exception 'invalid_workspace_limit';
  end if;

  -- Serializes creation per owner so the configurable limit cannot be raced.
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text, 0));

  if not exists (
    select 1
    from public.workspaces workspace
    where workspace.superuser_id = p_actor_id
  ) then
    raise exception 'workspace_creation_forbidden';
  end if;

  if (
    select count(*)
    from public.workspaces workspace
    where workspace.superuser_id = p_actor_id
  ) >= p_max_workspaces then
    raise exception 'workspace_limit_reached';
  end if;

  if exists (
    select 1
    from public.workspaces workspace
    where workspace.superuser_id = p_actor_id
      and lower(btrim(workspace.name)) = lower(v_name)
  ) then
    raise exception 'workspace_name_taken';
  end if;

  insert into public.workspaces (name, superuser_id)
  values (v_name, p_actor_id)
  returning * into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace.id, p_actor_id, 'administrador');

  insert into public.categories (workspace_id, name, type, is_default)
  select v_workspace.id, category.name, category.type, true
  from public.categories category
  where category.workspace_id is null
    and category.is_default = true;

  return jsonb_build_object(
    'id', v_workspace.id,
    'name', v_workspace.name,
    'superuser_id', v_workspace.superuser_id,
    'role', 'administrador',
    'created_at', v_workspace.created_at
  );
end;
$$;

create or replace function public.create_workspace_for_owner(
  p_actor_id uuid,
  p_name text,
  p_max_workspaces integer default 20
)
returns jsonb
language sql
set search_path = ''
as $$
  select private.create_workspace_core(p_actor_id, p_name, p_max_workspaces);
$$;

revoke all on function private.create_workspace_core(uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.create_workspace_for_owner(uuid, text, integer)
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.create_workspace_core(uuid, text, integer)
  to service_role;
grant execute on function public.create_workspace_for_owner(uuid, text, integer)
  to service_role;

-- Member administrators need to understand effective access for the people
-- they manage. Individual overrides remain writable only by permissions.update.
drop policy if exists member_permissions_own_read
  on public.workspace_member_permissions;
create policy member_permissions_member_manager_read
on public.workspace_member_permissions
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.has_workspace_permission(workspace_id, 'members', 'read')
);

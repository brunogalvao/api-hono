-- Workspace lifecycle mutations are executed only by the authenticated API
-- through service_role. The browser has no direct DELETE grant on workspaces.

create or replace function private.delete_workspace_core(
  p_actor_id uuid,
  p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace public.workspaces%rowtype;
  v_owned_count integer;
begin
  if p_actor_id is null then
    raise exception 'unauthorized';
  end if;

  if p_workspace_id is null then
    raise exception 'workspace_not_found';
  end if;

  -- Serialize lifecycle changes for the same owner with workspace creation.
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text, 0));

  select workspace.*
  into v_workspace
  from public.workspaces workspace
  where workspace.id = p_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found';
  end if;

  if v_workspace.superuser_id <> p_actor_id then
    raise exception 'workspace_delete_forbidden';
  end if;

  select count(*)::integer
  into v_owned_count
  from public.workspaces workspace
  where workspace.superuser_id = p_actor_id;

  if v_owned_count <= 1 then
    raise exception 'last_owned_workspace';
  end if;

  delete from public.workspaces
  where id = p_workspace_id;

  return jsonb_build_object(
    'status', 'deleted',
    'workspace_id', v_workspace.id,
    'workspace_name', v_workspace.name
  );
end;
$$;

create or replace function public.delete_workspace_for_owner(
  p_actor_id uuid,
  p_workspace_id uuid
)
returns jsonb
language sql
set search_path = ''
as $$
  select private.delete_workspace_core(p_actor_id, p_workspace_id);
$$;

create or replace function private.leave_workspace_core(
  p_actor_id uuid,
  p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace public.workspaces%rowtype;
  v_membership_id uuid;
begin
  if p_actor_id is null then
    raise exception 'unauthorized';
  end if;

  if p_workspace_id is null then
    raise exception 'workspace_not_found';
  end if;

  select workspace.*
  into v_workspace
  from public.workspaces workspace
  where workspace.id = p_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found';
  end if;

  if v_workspace.superuser_id = p_actor_id then
    raise exception 'workspace_owner_cannot_leave';
  end if;

  delete from public.workspace_member_permissions
  where workspace_id = p_workspace_id
    and user_id = p_actor_id;

  delete from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = p_actor_id
  returning id into v_membership_id;

  if v_membership_id is null then
    raise exception 'workspace_membership_not_found';
  end if;

  return jsonb_build_object(
    'status', 'left',
    'workspace_id', v_workspace.id,
    'workspace_name', v_workspace.name
  );
end;
$$;

create or replace function public.leave_workspace(
  p_actor_id uuid,
  p_workspace_id uuid
)
returns jsonb
language sql
set search_path = ''
as $$
  select private.leave_workspace_core(p_actor_id, p_workspace_id);
$$;

revoke all on function private.delete_workspace_core(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.delete_workspace_for_owner(uuid, uuid)
  from public, anon, authenticated;
revoke all on function private.leave_workspace_core(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.leave_workspace(uuid, uuid)
  from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function private.delete_workspace_core(uuid, uuid)
  to service_role;
grant execute on function public.delete_workspace_for_owner(uuid, uuid)
  to service_role;
grant execute on function private.leave_workspace_core(uuid, uuid)
  to service_role;
grant execute on function public.leave_workspace(uuid, uuid)
  to service_role;

-- Remove legacy surfaces that expose credentials or the global user directory.
alter table if exists public.users enable row level security;
drop policy if exists "Enable read access for all users" on public.users;
revoke all on table public.users from public, anon, authenticated;
comment on table public.users is
  'Deprecated and isolated. Authentication must use Supabase Auth; remove this table after confirming it contains no required data.';

drop policy if exists "Super admins can view all profiles" on public.profiles;
drop policy if exists "Workspace members can view shared profiles" on public.profiles;
create policy "Workspace members can view shared profiles"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members target_member
    where target_member.user_id = profiles.id
      and private.has_workspace_permission(
        target_member.workspace_id,
        'members',
        'read'
      )
  )
);

drop policy if exists "authenticated_read_profiles" on public.user_profiles;
drop policy if exists "Group members can view shared profiles" on public.user_profiles;
create policy "Group members can view shared profiles"
on public.user_profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.group_members target_member
    where target_member.user_id = user_profiles.id
      and exists (
        select 1
        from public.group_members caller_member
        where caller_member.group_id = target_member.group_id
          and caller_member.user_id = (select auth.uid())
      )
  )
);

-- Accept the legacy group invite in one transaction, bound to the authenticated
-- email. The caller cannot choose which user is added to the group.
create or replace function public.accept_legacy_group_invite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invite public.invites%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  select lower(trim(email))
  into v_user_email
  from auth.users
  where id = v_user_id;

  select *
  into v_invite
  from public.invites
  where token = p_token
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_invite.accepted_at is not null then
    return jsonb_build_object('status', 'accepted');
  end if;

  if v_invite.expires_at <= now() then
    return jsonb_build_object('status', 'expired');
  end if;

  if v_user_email is null or v_user_email <> lower(trim(v_invite.email)) then
    return jsonb_build_object('status', 'email_mismatch');
  end if;

  if exists (
    select 1
    from public.group_members
    where group_id = v_invite.group_id
      and user_id = v_user_id
  ) then
    return jsonb_build_object('status', 'already_member');
  end if;

  insert into public.group_members (
    group_id,
    user_id,
    role,
    access_expenses,
    access_incomes,
    access_installments,
    access_advisor
  ) values (
    v_invite.group_id,
    v_user_id,
    'member',
    coalesce(v_invite.access_expenses, true),
    coalesce(v_invite.access_incomes, true),
    coalesce(v_invite.access_installments, true),
    coalesce(v_invite.access_advisor, true)
  );

  update public.invites
  set accepted_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'status', 'accepted_successfully',
    'group_id', v_invite.group_id
  );
end;
$$;

revoke all on function public.accept_legacy_group_invite(uuid) from public, anon;
grant execute on function public.accept_legacy_group_invite(uuid) to authenticated;

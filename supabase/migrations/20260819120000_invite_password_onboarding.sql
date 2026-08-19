-- Track password onboarding for identities provisioned by workspace invitations.
alter table public.profiles
  add column if not exists password_setup_required boolean not null default false;

comment on column public.profiles.password_setup_required is
  'True while an invitation-provisioned account still needs to create a password.';

-- Existing invitation accounts are only prompted when Auth has no password hash.
update public.profiles profile
set password_setup_required = true
from auth.users auth_user
where auth_user.id = profile.id
  and profile.signup_origin = 'workspace_invite'
  and coalesce(auth_user.encrypted_password, '') = '';

-- New identities provisioned while an invite is pending must complete password setup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_email_normalized text := private.normalize_email(new.email);
  v_from_invite boolean;
  v_full_name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  select exists (
    select 1
    from public.workspace_invites wi
    where wi.email_normalized = v_email_normalized
      and wi.status = 'pending'
  ) into v_from_invite;

  insert into public.profiles (
    id,
    email,
    email_normalized,
    full_name,
    lgpd_consent_at,
    signup_origin,
    onboarding_status,
    onboarding_completed_at,
    password_setup_required
  ) values (
    new.id,
    new.email,
    v_email_normalized,
    v_full_name,
    case
      when (new.raw_user_meta_data ->> 'lgpd_consent')::boolean is true then now()
      else null
    end,
    case
      when v_from_invite then 'workspace_invite'::public.profile_signup_origin
      else 'self_signup'::public.profile_signup_origin
    end,
    case
      when v_full_name is null then 'incomplete'::public.profile_onboarding_status
      else 'complete'::public.profile_onboarding_status
    end,
    case when v_full_name is null then null else now() end,
    v_from_invite
  ) on conflict (id) do nothing;

  if v_from_invite then
    return new;
  end if;

  insert into public.workspaces (name, superuser_id)
  values (coalesce(v_full_name, split_part(new.email, '@', 1)) || '''s workspace', new.id)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, new.id, 'administrador');

  insert into public.categories (workspace_id, name, type, is_default)
  select v_workspace_id, name, type, true
  from public.categories
  where workspace_id is null and is_default = true;

  return new;
end;
$$;

-- Enrich successful invite operations without exposing password state on errors.
create or replace function public.preview_workspace_invite(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_password_setup_required boolean;
begin
  v_result := private.preview_workspace_invite_core(p_token, auth.uid());
  if v_result ->> 'status' <> 'valid' then
    return v_result;
  end if;

  select profile.password_setup_required
  into v_password_setup_required
  from public.profiles profile
  where profile.id = auth.uid();

  return v_result || jsonb_build_object(
    'password_setup_required', coalesce(v_password_setup_required, false)
  );
end;
$$;

create or replace function public.accept_workspace_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_password_setup_required boolean;
begin
  v_result := private.accept_workspace_invite_core(p_token, auth.uid());
  if (v_result ->> 'status') not in ('accepted', 'already_member') then
    return v_result;
  end if;

  select profile.password_setup_required
  into v_password_setup_required
  from public.profiles profile
  where profile.id = auth.uid();

  return v_result || jsonb_build_object(
    'password_setup_required', coalesce(v_password_setup_required, false)
  );
end;
$$;

revoke all on function public.preview_workspace_invite(text) from public, anon;
revoke all on function public.accept_workspace_invite(text) from public, anon;
grant execute on function public.preview_workspace_invite(text) to authenticated;
grant execute on function public.accept_workspace_invite(text) to authenticated;

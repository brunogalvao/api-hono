create or replace function private.reopen_expired_workspace_invite_core(
  p_actor_id uuid,
  p_workspace_id uuid,
  p_invite_id uuid,
  p_locale text,
  p_source text,
  p_actor_limit integer,
  p_recipient_limit integer,
  p_source_limit integer
)
returns table (
  result_status text,
  invite_id uuid,
  raw_token text,
  delivery_version integer,
  retry_after integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.workspace_invites%rowtype;
  v_raw_token text;
  v_retry_after integer;
begin
  if p_locale not in ('pt-BR', 'en') then
    raise exception 'invalid_locale' using errcode = '22023';
  end if;

  select * into v_invite
  from public.workspace_invites wi
  where wi.id = p_invite_id
  for update;

  if not found or v_invite.status <> 'expired' then
    raise exception 'invite_not_available' using errcode = 'P0002';
  end if;
  if p_workspace_id is not null and p_workspace_id <> v_invite.workspace_id then
    raise exception 'workspace_mismatch' using errcode = '22023';
  end if;
  if not private.has_members_permission(p_actor_id, v_invite.workspace_id, 'update') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.workspace_invites pending
    where pending.workspace_id = v_invite.workspace_id
      and pending.email_normalized = v_invite.email_normalized
      and pending.status = 'pending'
      and pending.id <> v_invite.id
  ) then
    return query
    select
      'existing_pending_invite',
      pending.id,
      null::text,
      pending.token_version,
      0
    from public.workspace_invites pending
    where pending.workspace_id = v_invite.workspace_id
      and pending.email_normalized = v_invite.email_normalized
      and pending.status = 'pending'
    order by pending.created_at desc
    limit 1;
    return;
  end if;

  v_retry_after := private.consume_workspace_invite_rate_limit(
    v_invite.id,
    v_invite.workspace_id,
    p_actor_id,
    v_invite.email_normalized,
    p_source,
    'resend',
    p_actor_limit,
    p_recipient_limit,
    p_source_limit
  );
  if v_retry_after > 0 then
    return query select 'rate_limited', v_invite.id, null::text, null::integer, v_retry_after;
    return;
  end if;

  v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  update public.workspace_invites
  set
    status = 'pending',
    token_hash = private.hash_invite_token(v_raw_token),
    token_version = token_version + 1,
    delivery_status = 'pending',
    locale = p_locale,
    expires_at = null,
    sent_at = null,
    last_delivery_attempt_at = null,
    accepted_at = null,
    accepted_by = null,
    cancelled_at = null,
    delivery_error_code = null,
    provider_message_id = null,
    updated_at = now()
  where id = v_invite.id
  returning * into v_invite;

  update private.workspace_invite_attempts
  set invite_id = v_invite.id, delivery_version = v_invite.token_version
  where id = (
    select attempt.id
    from private.workspace_invite_attempts attempt
    where attempt.workspace_id = v_invite.workspace_id
      and attempt.actor_id = p_actor_id
      and attempt.recipient_fingerprint = private.fingerprint(v_invite.email_normalized)
      and attempt.operation = 'resend'
      and attempt.result = 'allowed'
    order by attempt.created_at desc
    limit 1
  );

  return query select 'ready', v_invite.id, v_raw_token, v_invite.token_version, 0;
end;
$$;

create or replace function public.rotate_workspace_invite(
  p_operation text,
  p_actor_id uuid,
  p_workspace_id uuid default null,
  p_invite_id uuid default null,
  p_email text default null,
  p_role public.workspace_role default null,
  p_locale text default 'pt-BR',
  p_source text default 'unknown',
  p_actor_limit integer default 10,
  p_recipient_limit integer default 3,
  p_source_limit integer default 30
)
returns table (
  result_status text,
  invite_id uuid,
  raw_token text,
  delivery_version integer,
  retry_after integer
)
language plpgsql
set search_path = ''
as $$
begin
  if p_operation = 'resend' and exists (
    select 1
    from public.workspace_invites invite
    where invite.id = p_invite_id
      and invite.status = 'expired'
  ) then
    return query
    select * from private.reopen_expired_workspace_invite_core(
      p_actor_id,
      p_workspace_id,
      p_invite_id,
      p_locale,
      p_source,
      p_actor_limit,
      p_recipient_limit,
      p_source_limit
    );
    return;
  end if;

  return query
  select * from private.rotate_workspace_invite_core(
    p_operation,
    p_actor_id,
    p_workspace_id,
    p_invite_id,
    p_email,
    p_role,
    p_locale,
    p_source,
    p_actor_limit,
    p_recipient_limit,
    p_source_limit
  );
end;
$$;

create or replace function private.cancel_workspace_invite_core(
  p_invite_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.workspace_invites%rowtype;
  v_now timestamptz := statement_timestamp();
begin
  select * into v_invite
  from public.workspace_invites invite
  where invite.id = p_invite_id
  for update;
  if not found then
    return jsonb_build_object('status', 'not_found', 'error_code', 'invite_not_found');
  end if;
  if not private.has_members_permission(p_actor_id, v_invite.workspace_id, 'delete') then
    return jsonb_build_object('status', 'forbidden', 'error_code', 'forbidden');
  end if;
  if v_invite.status = 'cancelled' then
    return jsonb_build_object('status', 'already_cancelled', 'invite_id', v_invite.id);
  end if;
  if v_invite.status not in ('pending', 'expired') then
    return jsonb_build_object('status', 'not_available', 'error_code', 'invite_not_available');
  end if;

  update public.workspace_invites
  set status = 'cancelled', cancelled_at = v_now, updated_at = v_now
  where id = v_invite.id;
  return jsonb_build_object('status', 'cancelled', 'invite_id', v_invite.id);
end;
$$;

revoke all on function private.reopen_expired_workspace_invite_core(uuid, uuid, uuid, text, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function private.reopen_expired_workspace_invite_core(uuid, uuid, uuid, text, text, integer, integer, integer) to service_role;

revoke all on function public.rotate_workspace_invite(text, uuid, uuid, uuid, text, public.workspace_role, text, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.rotate_workspace_invite(text, uuid, uuid, uuid, text, public.workspace_role, text, text, integer, integer, integer) to service_role;

revoke all on function private.cancel_workspace_invite_core(uuid, uuid) from public, anon, authenticated;

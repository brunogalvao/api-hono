alter table public.transactions
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

alter table public.recurring_expenses
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

alter table public.installments
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

create index if not exists transactions_updated_by_idx
  on public.transactions (updated_by);
create index if not exists recurring_expenses_created_by_idx
  on public.recurring_expenses (created_by);
create index if not exists recurring_expenses_updated_by_idx
  on public.recurring_expenses (updated_by);
create index if not exists installments_created_by_idx
  on public.installments (created_by);
create index if not exists installments_updated_by_idx
  on public.installments (updated_by);

create or replace function private.stamp_financial_record_audit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor_id is not null then
      new.created_by := actor_id;
    end if;

    new.created_at := now();
    new.updated_at := new.created_at;
    new.updated_by := null;
    return new;
  end if;

  if new.workspace_id is distinct from old.workspace_id then
    raise exception 'workspace_id_is_immutable' using errcode = '22023';
  end if;

  if new.created_by is distinct from old.created_by then
    raise exception 'created_by_is_immutable' using errcode = '22023';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'created_at_is_immutable' using errcode = '22023';
  end if;

  new.updated_by := actor_id;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.stamp_financial_record_audit() from public, anon, authenticated;

drop trigger if exists transactions_stamp_audit on public.transactions;
create trigger transactions_stamp_audit
before insert or update on public.transactions
for each row execute function private.stamp_financial_record_audit();

drop trigger if exists recurring_expenses_stamp_audit on public.recurring_expenses;
create trigger recurring_expenses_stamp_audit
before insert or update on public.recurring_expenses
for each row execute function private.stamp_financial_record_audit();

drop trigger if exists installments_stamp_audit on public.installments;
create trigger installments_stamp_audit
before insert or update on public.installments
for each row execute function private.stamp_financial_record_audit();

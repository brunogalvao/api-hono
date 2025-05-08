-- Create tasks table
create table if not exists tasks (
    id uuid primary key default gen_random_uuid (),
    title text not null,
    done boolean default false,
    created_at timestamp
    with
        time zone default now ()
);

-- Enable Row Level Security
alter table tasks enable row level security;

-- Public policies (for dev/testing)
create policy "Todos podem ler tarefas" on tasks for
select
    using (true);

create policy "Todos podem criar tarefas" on tasks for insert
with
    check (true);

create policy "Todos podem atualizar tarefas" on tasks for
update using (true);

create policy "Todos podem deletar tarefas" on tasks for delete using (true);

-- Every authenticated member must be able to discover their own workspaces.
-- Reading other memberships remains controlled by the workspace's members.read
-- permission.
drop policy if exists members_effective_read on public.workspace_members;

create policy members_effective_read
on public.workspace_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.has_workspace_permission(workspace_id, 'members', 'read')
);

-- Supports the workspace bootstrap query filtered by the current user and
-- ordered by membership creation time.
create index if not exists workspace_members_user_id_created_at_idx
on public.workspace_members (user_id, created_at);

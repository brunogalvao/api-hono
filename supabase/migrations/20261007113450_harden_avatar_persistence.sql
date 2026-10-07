-- Keep the application profile projections in sync with Supabase Auth.
create or replace function public.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'displayName', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', '')
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    email = excluded.email,
    updated_at = now();

  if tg_op = 'UPDATE' then
    update public.profiles
    set
      email = coalesce(new.email, public.profiles.email),
      full_name = coalesce(
        nullif(new.raw_user_meta_data->>'displayName', ''),
        nullif(new.raw_user_meta_data->>'full_name', ''),
        nullif(new.raw_user_meta_data->>'name', ''),
        public.profiles.full_name
      ),
      -- A custom avatar saved by the app is canonical. OAuth providers may
      -- refresh raw_user_meta_data on login, so they must not overwrite it.
      avatar_url = coalesce(
        public.profiles.avatar_url,
        new.raw_user_meta_data->>'avatar_url'
      ),
      updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke execute on function public.sync_user_profile() from public, anon, authenticated;

-- Seed the canonical profile only when it has no avatar yet. From this point
-- onward, profile changes are written directly to public.profiles by the app.
update public.profiles as profile
set
  avatar_url = auth_profile.avatar_url,
  updated_at = now()
from public.user_profiles as auth_profile
where profile.id = auth_profile.id
  and profile.avatar_url is null
  and auth_profile.avatar_url is not null;

-- New avatar paths are scoped by user: avatars/{auth.uid()}/{uuid}.{ext}.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Authenticated users can update avatars" on storage.objects;
drop policy if exists "Authenticated users can delete avatars" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

create policy "Users can upload own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
);

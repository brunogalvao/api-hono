-- Backfill user_profiles para usuários já existentes
INSERT INTO public.user_profiles (id, display_name, avatar_url, email)
SELECT
  id,
  raw_user_meta_data->>'displayName',
  raw_user_meta_data->>'avatar_url',
  email
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url   = EXCLUDED.avatar_url,
  email        = EXCLUDED.email,
  updated_at   = now();

-- FK de group_members → user_profiles para PostgREST conseguir fazer o join
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
  ON DELETE CASCADE;

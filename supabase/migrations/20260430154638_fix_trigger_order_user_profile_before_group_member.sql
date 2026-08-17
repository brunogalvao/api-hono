CREATE OR REPLACE FUNCTION public.handle_new_user_personal_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_gid uuid;
BEGIN
  -- Garante que user_profiles existe antes de inserir em group_members (FK constraint)
  INSERT INTO public.user_profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'displayName',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.groups (name, type, owner_id)
  VALUES ('Pessoal', 'personal', NEW.id)
  RETURNING id INTO new_gid;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (new_gid, NEW.id, 'owner');

  RETURN NEW;
END;
$$;;

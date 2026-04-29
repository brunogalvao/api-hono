-- Função chamada após cada novo usuário ser criado no Supabase Auth.
-- Cria automaticamente um grupo pessoal e registra o usuário como owner.
CREATE OR REPLACE FUNCTION public.handle_new_user_personal_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_gid uuid;
BEGIN
  INSERT INTO public.groups (name, type, owner_id)
  VALUES ('Pessoal', 'personal', NEW.id)
  RETURNING id INTO new_gid;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (new_gid, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

-- Trigger disparado após INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_personal_group ON auth.users;

CREATE TRIGGER on_auth_user_created_personal_group
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_personal_group();

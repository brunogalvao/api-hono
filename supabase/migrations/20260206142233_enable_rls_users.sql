ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);;

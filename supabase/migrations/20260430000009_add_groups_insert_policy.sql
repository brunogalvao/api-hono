CREATE POLICY "authenticated_create_group" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_see_own_group" ON groups
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());;

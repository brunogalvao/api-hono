
-- Super admins (workspace creators) need to read all profiles
-- to display the full user list on the permissions management page.
-- PERMISSIVE + existing policy means: regular users still see only their own.
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.superuser_id = auth.uid()
  )
);
;

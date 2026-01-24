-- ============================================
-- COMPREHENSIVE FIX: Rebuild all groups table policies
-- ============================================

-- STEP 1: Show current policies on groups table
SELECT 'Current policies on groups:' as status;
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'groups';

-- STEP 2: Drop ALL existing policies on groups
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Creators and admins can update groups" ON groups;
DROP POLICY IF EXISTS "Creators can delete groups" ON groups;

-- STEP 3: Recreate all 4 policies correctly

-- SELECT: Users can view groups they're members of
CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (is_group_member(id, auth.uid()));

-- INSERT: Users can create groups (they must be the creator)
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- UPDATE: Only creators and admins can update
CREATE POLICY "Creators and admins can update groups"
  ON groups FOR UPDATE
  USING (has_group_role(id, auth.uid(), ARRAY['creator', 'admin']));

-- DELETE: Only creators can delete
CREATE POLICY "Creators can delete groups"
  ON groups FOR DELETE
  USING (auth.uid() = creator_id);

-- STEP 4: Verify all policies were created
SELECT 'Policies after fix:' as status;
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd, policyname;

-- Expected 4 policies:
-- DELETE | Creators can delete groups          | PERMISSIVE
-- INSERT | Users can create groups             | PERMISSIVE
-- SELECT | Users can view their groups         | PERMISSIVE
-- UPDATE | Creators and admins can update groups | PERMISSIVE

SELECT 'Fix complete! Try creating a group now.' as status;

-- ============================================
-- FIX: Add missing INSERT and DELETE policies on groups table
-- Error: "new row violates row-level security policy for table groups"
-- ============================================

-- The previous fix removed the INSERT and DELETE policies on groups
-- but forgot to recreate them. Adding them back now.

-- Allow users to create groups (must set themselves as creator)
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Allow creators to delete their groups
CREATE POLICY "Creators can delete groups"
  ON groups FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================
-- Verify all policies on groups table
-- ============================================

SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd, policyname;

-- Expected output:
-- DELETE | Creators can delete groups
-- INSERT | Users can create groups
-- SELECT | Users can view their groups
-- UPDATE | Creators and admins can update groups

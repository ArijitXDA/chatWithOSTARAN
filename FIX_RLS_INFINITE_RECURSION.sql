-- ============================================
-- FIX: RLS Infinite Recursion Error (42P17)
-- Fixes "infinite recursion detected in policy for relation group_members"
-- ============================================

-- The problem: Policies on group_members were querying group_members,
-- creating circular references. This fix uses non-recursive approaches.

-- ============================================
-- STEP 1: Drop all existing RLS policies
-- ============================================

-- Drop group_members policies (these cause the recursion)
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can join groups (insert themselves)" ON group_members;
DROP POLICY IF EXISTS "Creators and admins can remove members" ON group_members;

-- Drop policies on other tables that reference group_members
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Creators and admins can update groups" ON groups;
DROP POLICY IF EXISTS "Users can view messages from their groups" ON group_messages;
DROP POLICY IF EXISTS "Users can send messages to their groups" ON group_messages;
DROP POLICY IF EXISTS "Users can view context of their groups" ON group_conversation_context;

-- ============================================
-- STEP 2: Create helper function to check membership (SECURITY DEFINER)
-- ============================================

-- This function bypasses RLS to check if a user is a member of a group
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$;

-- Helper to check if user has specific role in group
CREATE OR REPLACE FUNCTION has_group_role(p_group_id UUID, p_user_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = ANY(p_roles)
  );
END;
$$;

-- ============================================
-- STEP 3: Recreate group_members policies (NON-RECURSIVE)
-- ============================================

-- Allow users to see their own membership records
-- This is safe - no recursion as it doesn't query group_members
CREATE POLICY "Users can view their own memberships"
  ON group_members FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to see other members in groups they belong to
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "Users can view members in their groups"
  ON group_members FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Users can insert themselves into groups (for joining)
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Creators and admins can remove members
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "Creators and admins can remove members"
  ON group_members FOR DELETE
  USING (has_group_role(group_id, auth.uid(), ARRAY['creator', 'admin']));

-- ============================================
-- STEP 4: Recreate groups policies (using helper functions)
-- ============================================

CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (is_group_member(id, auth.uid()));

CREATE POLICY "Creators and admins can update groups"
  ON groups FOR UPDATE
  USING (has_group_role(id, auth.uid(), ARRAY['creator', 'admin']));

-- ============================================
-- STEP 5: Recreate group_messages policies (using helper functions)
-- ============================================

CREATE POLICY "Users can view messages in their groups"
  ON group_messages FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can send messages to their groups"
  ON group_messages FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND (
      (sender_type = 'user' AND user_id = auth.uid()) OR
      sender_type = 'ai'
    )
  );

-- ============================================
-- STEP 6: Recreate group_conversation_context policies (using helper functions)
-- ============================================

CREATE POLICY "Users can view context of their groups"
  ON group_conversation_context FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- ============================================
-- STEP 7: Verify the fix
-- ============================================

-- Check that helper functions were created
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name IN ('is_group_member', 'has_group_role')
ORDER BY routine_name;

-- List all policies on group_members
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'group_members'
ORDER BY policyname;

-- ============================================
-- SUCCESS! Try creating a group now.
-- The recursion should be fixed.
-- ============================================

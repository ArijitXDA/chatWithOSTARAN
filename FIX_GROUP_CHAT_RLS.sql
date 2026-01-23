-- ============================================
-- FIX: Group Chat RLS Issues
-- Run this to fix "Failed to create group" error
-- ============================================

-- Step 1: Drop and recreate the trigger function with SECURITY DEFINER
DROP FUNCTION IF EXISTS add_creator_as_member() CASCADE;

CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER
SECURITY DEFINER  -- This bypasses RLS when the trigger runs
SET search_path = public
AS $$
BEGIN
  -- Add creator as a member with 'creator' role
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'creator');

  -- Initialize conversation context for the group
  INSERT INTO group_conversation_context (group_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS add_creator_as_member_trigger ON groups;
CREATE TRIGGER add_creator_as_member_trigger
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- Step 3: Verify the fix
-- This should show 'DEFINER' in the result
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'add_creator_as_member';

-- ============================================
-- After running this, try creating a group again!
-- ============================================

-- ============================================
-- FIX: Group Join Flow - RLS Policy Analysis
-- ============================================

-- Problem: Users can't join groups because they can't SELECT the group
-- by invite_code. The current policy only allows viewing groups where
-- the user is already a member (chicken-and-egg problem).

-- Analysis: We have two options:
-- OPTION A: Add RLS policy to allow SELECT by invite_code
-- OPTION B: Use service role client in join API (bypasses RLS)

-- Choosing OPTION B because:
-- 1. The invite_code itself is the secret that grants access
-- 2. We're already validating user is authenticated
-- 3. Simpler and more secure than making groups publicly viewable

-- The fix will be in the API code (app/api/groups/join/route.ts)
-- No database changes needed!

-- ============================================
-- VERIFICATION: Check current RLS policies
-- ============================================

SELECT
  polname as policy_name,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE pg_class.relname = 'groups'
ORDER BY polcmd, polname;

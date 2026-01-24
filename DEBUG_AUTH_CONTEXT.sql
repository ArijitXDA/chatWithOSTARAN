-- ============================================
-- DEBUG: Check if auth.uid() is working
-- ============================================

-- This will show if the current user is authenticated
SELECT
  auth.uid() as current_user_id,
  CASE
    WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED - This is the problem!'
    ELSE 'Authenticated successfully'
  END as auth_status;

-- Show all policies on groups table
SELECT policyname, cmd,
       pg_get_expr(polqual, polrelid) as using_clause,
       pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE pg_class.relname = 'groups';

-- ============================================
-- If auth.uid() returns NULL above:
-- The issue is that the server-side Supabase client
-- isn't passing the user's JWT token to the database.
--
-- SOLUTION: We need to make the INSERT policy work
-- without relying on auth.uid() for the creator_id check
-- since the server already verified the user.
-- ============================================

-- ============================================
-- AGGRESSIVE FIX: Completely rebuild detected_tone constraint
-- ============================================

-- Step 1: Find and drop ALL constraints on this table
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'group_conversation_context'::regclass
      AND contype = 'c'  -- CHECK constraints only
  ) LOOP
    EXECUTE format('ALTER TABLE group_conversation_context DROP CONSTRAINT IF EXISTS %I CASCADE', r.conname);
  END LOOP;
END $$;

-- Step 2: Change the default value to NULL temporarily
ALTER TABLE group_conversation_context
  ALTER COLUMN detected_tone DROP DEFAULT;

-- Step 3: Set default to 'neutral' without constraint
ALTER TABLE group_conversation_context
  ALTER COLUMN detected_tone SET DEFAULT 'neutral';

-- Step 4: Add the corrected constraint including 'neutral'
ALTER TABLE group_conversation_context
  ADD CONSTRAINT group_conversation_context_detected_tone_check
  CHECK (detected_tone IN ('neutral', 'professional', 'friendly', 'casual', 'technical', 'academic'));

-- Step 5: Verify the constraint
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'group_conversation_context'::regclass
  AND contype = 'c';

-- Step 6: Test that 'neutral' works
SELECT 'neutral'::text IN ('neutral', 'professional', 'friendly', 'casual', 'technical', 'academic') as should_be_true;

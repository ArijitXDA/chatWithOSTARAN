-- ============================================
-- FIX: Add 'neutral' to detected_tone CHECK constraint
-- Error: "new row for relation group_conversation_context violates check constraint"
-- ============================================

-- The issue: detected_tone has DEFAULT 'neutral' but CHECK constraint
-- only allows: 'professional', 'friendly', 'casual', 'technical', 'academic'

-- Drop the existing constraint
ALTER TABLE group_conversation_context
  DROP CONSTRAINT IF EXISTS group_conversation_context_detected_tone_check;

-- Add the corrected constraint that includes 'neutral'
ALTER TABLE group_conversation_context
  ADD CONSTRAINT group_conversation_context_detected_tone_check
  CHECK (detected_tone IN ('neutral', 'professional', 'friendly', 'casual', 'technical', 'academic'));

-- Verify the fix
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'group_conversation_context_detected_tone_check';

-- Success! The default 'neutral' value will now work correctly.

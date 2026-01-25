-- ============================================
-- MIGRATION: Add token_count to group_messages
-- ============================================

-- Purpose: Track token usage for each group message (especially AI responses)
-- This matches the token_count column in the messages table for personal chat

-- Add token_count column to group_messages
ALTER TABLE group_messages
  ADD COLUMN IF NOT EXISTS token_count INTEGER;

-- Add comment
COMMENT ON COLUMN group_messages.token_count IS 'Number of tokens used for this message (mainly for AI responses)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'group_messages'
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS! Token count tracking enabled for group messages
-- ============================================

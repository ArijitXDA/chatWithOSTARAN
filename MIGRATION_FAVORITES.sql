-- Migration: Add favorites feature to chat threads
-- Run this in Supabase SQL Editor for existing databases

-- Add is_favorite column to chat_threads
ALTER TABLE chat_threads
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Drop old index if it exists (to be replaced with composite index)
DROP INDEX IF EXISTS idx_threads_updated;

-- Create new composite index for efficient favorite + date sorting
CREATE INDEX IF NOT EXISTS idx_threads_user_favorite_updated
ON chat_threads(user_id, is_favorite DESC, updated_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN chat_threads.is_favorite IS 'Whether this thread is marked as favorite/pinned by the user';

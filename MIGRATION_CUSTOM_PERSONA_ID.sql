-- Migration: Add custom_persona_id to chat_threads
-- Run this in Supabase SQL Editor for existing databases

-- Add custom_persona_id column to chat_threads
ALTER TABLE chat_threads
ADD COLUMN IF NOT EXISTS custom_persona_id UUID REFERENCES custom_personas(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_threads_custom_persona
ON chat_threads(custom_persona_id) WHERE custom_persona_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN chat_threads.custom_persona_id IS 'ID of the custom persona used for this thread (if persona type is custom)';

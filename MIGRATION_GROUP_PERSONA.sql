-- ============================================
-- MIGRATION: Add Group Persona Support
-- ============================================

-- Purpose: Allow groups to have their own persona for oStaran
-- Any member can create and all members can select from available personas

-- APPROACH: Use existing custom_personas table
-- Group references a persona, persona can be created by any member
-- When selected for a group, it becomes the "group persona"

-- Add group_persona_id column to groups table
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS group_persona_id UUID REFERENCES custom_personas(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN groups.group_persona_id IS 'Currently selected persona for oStaran in this group';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_groups_persona ON groups(group_persona_id) WHERE group_persona_id IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'groups' AND column_name = 'group_persona_id';

-- ============================================
-- USAGE:
-- 1. Any group member can create a custom persona
-- 2. Group settings show dropdown of all group members' personas
-- 3. Any member can select a persona for the group
-- 4. Selected persona becomes active for all group AI responses
-- 5. If NULL, oStaran uses default behavior
-- ============================================

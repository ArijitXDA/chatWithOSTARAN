-- ============================================
-- CONSOLIDATED MIGRATION FOR EXISTING DATABASES
-- Run this ONLY if you have an existing chatWithOSTARAN database
-- This adds all new features: custom personas, favorites, and persona ID tracking
-- ============================================

-- Step 1: Create custom_personas table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎭',
  description TEXT,
  system_prompt TEXT NOT NULL,

  -- Advanced tuning parameters
  temperature_default DECIMAL(2,1) DEFAULT 0.7 CHECK (temperature_default >= 0 AND temperature_default <= 2),
  max_tokens INTEGER DEFAULT 4000,
  top_p DECIMAL(3,2) DEFAULT 1.0 CHECK (top_p >= 0 AND top_p <= 1),
  frequency_penalty DECIMAL(2,1) DEFAULT 0.0 CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
  presence_penalty DECIMAL(2,1) DEFAULT 0.0 CHECK (presence_penalty >= -2 AND presence_penalty <= 2),

  -- Behavioral traits
  creativity_level TEXT DEFAULT 'balanced' CHECK (creativity_level IN ('conservative', 'balanced', 'creative', 'experimental')),
  formality_level TEXT DEFAULT 'balanced' CHECK (formality_level IN ('casual', 'balanced', 'formal', 'academic')),
  verbosity_level TEXT DEFAULT 'balanced' CHECK (verbosity_level IN ('concise', 'balanced', 'detailed', 'comprehensive')),

  -- Response style preferences
  use_emojis BOOLEAN DEFAULT false,
  use_markdown BOOLEAN DEFAULT true,
  use_code_blocks BOOLEAN DEFAULT true,
  citation_style TEXT CHECK (citation_style IN ('none', 'inline', 'footnotes', 'academic')),

  -- Knowledge and expertise settings
  expertise_domains TEXT[],
  language_style TEXT DEFAULT 'standard' CHECK (language_style IN ('standard', 'technical', 'simplified', 'storytelling')),
  reasoning_style TEXT DEFAULT 'balanced' CHECK (reasoning_style IN ('intuitive', 'balanced', 'analytical', 'step_by_step')),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add is_favorite column to chat_threads
ALTER TABLE chat_threads
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Step 3: Add custom_persona_id column to chat_threads
ALTER TABLE chat_threads
ADD COLUMN IF NOT EXISTS custom_persona_id UUID REFERENCES custom_personas(id) ON DELETE SET NULL;

-- Step 4: Update chat_threads constraint to include 'custom' persona
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS valid_persona;
ALTER TABLE chat_threads
ADD CONSTRAINT valid_persona CHECK (persona IN ('default', 'researcher', 'professor', 'student', 'marketing_manager', 'hr_manager', 'custom'));

-- Step 5: Enable RLS on custom_personas if not already enabled
ALTER TABLE custom_personas ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for custom_personas
DROP POLICY IF EXISTS "Users can view own custom personas" ON custom_personas;
CREATE POLICY "Users can view own custom personas"
  ON custom_personas FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own custom personas" ON custom_personas;
CREATE POLICY "Users can create own custom personas"
  ON custom_personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own custom personas" ON custom_personas;
CREATE POLICY "Users can update own custom personas"
  ON custom_personas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own custom personas" ON custom_personas;
CREATE POLICY "Users can delete own custom personas"
  ON custom_personas FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_personas_user ON custom_personas(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_threads_user_favorite_updated ON chat_threads(user_id, is_favorite DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_custom_persona ON chat_threads(custom_persona_id) WHERE custom_persona_id IS NOT NULL;

-- Step 8: Drop old index if it exists
DROP INDEX IF EXISTS idx_threads_updated;

-- Step 9: Create trigger for custom_personas updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_personas_updated_at ON custom_personas;
CREATE TRIGGER update_custom_personas_updated_at
  BEFORE UPDATE ON custom_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Add helpful comments
COMMENT ON COLUMN chat_threads.is_favorite IS 'Whether this thread is marked as favorite/pinned by the user';
COMMENT ON COLUMN chat_threads.custom_persona_id IS 'ID of the custom persona used for this thread (if persona type is custom)';
COMMENT ON TABLE custom_personas IS 'User-created custom AI personas with advanced tuning parameters';

-- Migration complete!
-- You can now use:
-- ✅ Multiple custom personas per user
-- ✅ Favorite/pin conversations
-- ✅ Auto-generated thread titles
-- ✅ Advanced persona tuning (temperature, top_p, penalties, etc.)

-- ============================================
-- MIGRATION: Add Custom Personas Support
-- ============================================
-- Run this migration if you already have an existing database
-- This adds support for custom personas with advanced tuning

-- Step 1: Update chat_threads constraint to allow 'custom' persona
ALTER TABLE chat_threads
DROP CONSTRAINT IF EXISTS valid_persona;

ALTER TABLE chat_threads
ADD CONSTRAINT valid_persona
CHECK (persona IN ('default', 'researcher', 'professor', 'student', 'marketing_manager', 'hr_manager', 'custom'));

-- Step 2: Create custom_personas table
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
  expertise_domains TEXT[], -- Array of domain tags
  language_style TEXT DEFAULT 'standard' CHECK (language_style IN ('standard', 'technical', 'simplified', 'storytelling')),
  reasoning_style TEXT DEFAULT 'balanced' CHECK (reasoning_style IN ('intuitive', 'balanced', 'analytical', 'step_by_step')),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_custom_personas_user ON custom_personas(user_id, is_active);

-- Step 4: Enable Row Level Security
ALTER TABLE custom_personas ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
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

-- Step 6: Add trigger for updated_at
DROP TRIGGER IF EXISTS update_custom_personas_updated_at ON custom_personas;
CREATE TRIGGER update_custom_personas_updated_at
  BEFORE UPDATE ON custom_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration Complete
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Custom Personas migration completed successfully!';
  RAISE NOTICE '🎭 Users can now create custom personas with advanced tuning';
  RAISE NOTICE '⚙️ Temperature slider works independently of persona settings';
END $$;

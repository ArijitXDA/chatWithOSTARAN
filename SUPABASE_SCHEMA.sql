-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  country_code TEXT DEFAULT '+91',
  occupation TEXT,
  age INTEGER CHECK (age >= 13 AND age <= 120),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT THREADS TABLE
-- ============================================
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  model TEXT NOT NULL DEFAULT 'claude',
  persona TEXT NOT NULL DEFAULT 'default',
  temperature DECIMAL(2,1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_model CHECK (model IN ('claude', 'openai', 'gemini', 'grok', 'ostaran-llm', 'ostaran-slm')),
  CONSTRAINT valid_persona CHECK (persona IN ('default', 'researcher', 'professor', 'student', 'marketing_manager', 'hr_manager', 'custom'))
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_count INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATION SUMMARIES (Optional)
-- ============================================
CREATE TABLE conversation_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  messages_covered INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOM PERSONAS TABLE
-- ============================================
CREATE TABLE custom_personas (
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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_threads_user_created ON chat_threads(user_id, created_at DESC);
CREATE INDEX idx_threads_user_favorite_updated ON chat_threads(user_id, is_favorite DESC, updated_at DESC);
CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at ASC);
CREATE INDEX idx_custom_personas_user ON custom_personas(user_id, is_active);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_personas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Profiles
-- ============================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - Chat Threads
-- ============================================
CREATE POLICY "Users can view own threads"
  ON chat_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own threads"
  ON chat_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
  ON chat_threads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads"
  ON chat_threads FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - Messages
-- ============================================
CREATE POLICY "Users can view own thread messages"
  ON messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own threads"
  ON messages FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - Summaries
-- ============================================
CREATE POLICY "Users can view own thread summaries"
  ON conversation_summaries FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert summaries in own threads"
  ON conversation_summaries FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - Custom Personas
-- ============================================
CREATE POLICY "Users can view own custom personas"
  ON custom_personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom personas"
  ON custom_personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom personas"
  ON custom_personas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom personas"
  ON custom_personas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to chat_threads
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to custom_personas
CREATE TRIGGER update_custom_personas_updated_at
  BEFORE UPDATE ON custom_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEMO: Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Tables: profiles, chat_threads, messages, conversation_summaries, custom_personas';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '🎯 Ready for authentication, chat, and custom persona functionality';
END $$;

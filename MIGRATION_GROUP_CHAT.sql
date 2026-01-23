-- ============================================
-- GROUP CHAT SCHEMA
-- Enables collaborative conversations with oStaran AI agent
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table (tracks who's in each group)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

-- Group messages table (stores all group chat messages)
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  mentioned_ostaran BOOLEAN DEFAULT false,
  ai_should_respond BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group conversation context (for AI to track topics and tone)
CREATE TABLE IF NOT EXISTS group_conversation_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  detected_tone TEXT DEFAULT 'neutral' CHECK (detected_tone IN ('professional', 'friendly', 'casual', 'technical', 'academic')),
  detected_topics TEXT[],
  last_ai_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_ai_respond ON group_messages(group_id) WHERE ai_should_respond = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_conversation_context ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators and admins can update groups"
  ON groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
    )
  );

CREATE POLICY "Creators can delete groups"
  ON groups FOR DELETE
  USING (auth.uid() = creator_id);

-- Group members policies
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups (insert themselves)"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators and admins can remove members"
  ON group_members FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
    )
  );

-- Group messages policies
CREATE POLICY "Users can view messages from their groups"
  ON group_messages FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their groups"
  ON group_messages FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
    AND (
      (sender_type = 'user' AND user_id = auth.uid()) OR
      sender_type = 'ai'
    )
  );

-- Group conversation context policies
CREATE POLICY "Users can view context of their groups"
  ON group_conversation_context FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage conversation context"
  ON group_conversation_context FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update groups.updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update group_conversation_context.updated_at
CREATE TRIGGER update_group_context_updated_at
  BEFORE UPDATE ON group_conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to add creator as first member when group is created
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypass RLS for automatic operations
SET search_path = public
AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'creator');

  INSERT INTO group_conversation_context (group_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_creator_as_member_trigger ON groups;
CREATE TRIGGER add_creator_as_member_trigger
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE groups IS 'Group chats where oStaran AI agent monitors and participates';
COMMENT ON TABLE group_members IS 'Tracks members in each group';
COMMENT ON TABLE group_messages IS 'All messages in group chats (user and AI)';
COMMENT ON TABLE group_conversation_context IS 'AI context tracking for intelligent interventions';
COMMENT ON COLUMN groups.invite_code IS 'Unique shareable code for inviting new members';
COMMENT ON COLUMN group_messages.mentioned_ostaran IS 'Whether oStaran was explicitly mentioned';
COMMENT ON COLUMN group_messages.ai_should_respond IS 'Flag indicating AI should generate a response';

-- Migration: Add File Attachments Support
-- Date: 2026-02-06
-- Description: Adds file_attachments table for storing uploaded files (images, PDFs, Excel, docs)

-- ============================================
-- FILE ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- mime type (image/png, application/pdf, etc.)
  file_size INTEGER NOT NULL, -- in bytes
  file_category TEXT NOT NULL CHECK (file_category IN ('image', 'document', 'spreadsheet', 'other')),

  -- Storage information
  storage_path TEXT NOT NULL, -- path in Supabase Storage
  storage_bucket TEXT DEFAULT 'chat-attachments',

  -- Extracted content (for non-image files)
  extracted_text TEXT, -- parsed content from PDFs, docs, excel

  -- Image-specific metadata
  width INTEGER,
  height INTEGER,

  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_file_attachments_message ON file_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_user ON file_attachments(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can create own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can update own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can delete own file attachments" ON file_attachments;

-- Create policies
CREATE POLICY "Users can view own file attachments"
  ON file_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own file attachments"
  ON file_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own file attachments"
  ON file_attachments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own file attachments"
  ON file_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Note: Create the storage bucket in Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Create new bucket: "chat-attachments"
-- 3. Set to private (RLS enabled)
-- 4. Add policy: Users can upload files to their own folder
-- 5. Add policy: Users can view/download their own files

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ File attachments migration completed successfully!';
  RAISE NOTICE '📎 Table: file_attachments created';
  RAISE NOTICE '🔒 RLS policies configured';
  RAISE NOTICE '📝 Next step: Create "chat-attachments" storage bucket in Supabase Dashboard';
END $$;

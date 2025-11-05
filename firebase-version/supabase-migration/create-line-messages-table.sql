-- Create line_messages table for storing LINE Bot messages
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS line_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_text TEXT,
  message_type TEXT,
  source_type TEXT CHECK (source_type IN ('user', 'group', 'room')),
  source_id TEXT,
  user_id TEXT,
  image_url TEXT,
  raw_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_line_messages_processed ON line_messages(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_line_messages_source ON line_messages(source_type, source_id);

-- Enable real-time (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE line_messages;

-- Grant permissions
ALTER TABLE line_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to insert (for webhook)
CREATE POLICY "Service role can insert messages" ON line_messages
  FOR INSERT
  WITH CHECK (true);

-- Policy: Authenticated users can read and update
CREATE POLICY "Users can read messages" ON line_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update messages" ON line_messages
  FOR UPDATE
  USING (auth.role() = 'authenticated');


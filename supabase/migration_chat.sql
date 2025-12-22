-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    source TEXT NOT NULL CHECK (source IN ('web', 'discord')),
    discord_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read messages (Public Chat)
CREATE POLICY "Public Read Access" 
ON chat_messages FOR SELECT 
USING (true);

-- Policy: Authenticated users can insert (Web Chat)
CREATE POLICY "Authenticated Insert Access" 
ON chat_messages FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Service Role can do everything (Bot/Admin)
CREATE POLICY "Service Role Full Access" 
ON chat_messages FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

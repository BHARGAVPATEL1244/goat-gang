-- Create Neighborhoods Table
CREATE TABLE IF NOT EXISTS neighborhoods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    text_color TEXT DEFAULT '#ffffff',
    requirements TEXT[] DEFAULT '{}',
    derby_requirements TEXT[] DEFAULT '{}', -- Changed to array
    tag TEXT,
    leader TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Main', 'Mini', 'Weekly Derby'
    date DATE, -- Event date for sorting
    winners TEXT[] DEFAULT '{}',
    host TEXT,
    sponsors JSONB DEFAULT '[]'::jsonb, -- Array of {name: string, amount: string}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public read, allow authenticated insert/update/delete)
-- Note: For simplicity in this demo, we might allow public write if auth isn't fully set up on the client side for RLS.
-- However, since we have an admin login, we should ideally restrict writes.
-- For now, let's allow public read and public write to ensure it works easily with the server actions, 
-- assuming the server actions themselves are protected or we are using the service role key (which bypasses RLS) 
-- OR we just allow anon writes for this specific demo if using the anon key.
-- A better approach for production:
-- READ: Public
-- WRITE: Authenticated users only (if using Supabase Auth) OR Service Role only.

-- Policy for Neighborhoods
CREATE POLICY "Public neighborhoods are viewable by everyone" ON neighborhoods
    FOR SELECT USING (true);

CREATE POLICY "Neighborhoods are insertable by everyone" ON neighborhoods
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Neighborhoods are updatable by everyone" ON neighborhoods
    FOR UPDATE USING (true);

CREATE POLICY "Neighborhoods are deletable by everyone" ON neighborhoods
    FOR DELETE USING (true);

-- Policy for Events
CREATE POLICY "Public events are viewable by everyone" ON events
    FOR SELECT USING (true);

CREATE POLICY "Events are insertable by everyone" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Events are updatable by everyone" ON events
    FOR UPDATE USING (true);

CREATE POLICY "Events are deletable by everyone" ON events
    FOR DELETE USING (true);

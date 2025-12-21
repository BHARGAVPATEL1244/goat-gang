-- Add category column to wiki_pages table
ALTER TABLE wiki_pages 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

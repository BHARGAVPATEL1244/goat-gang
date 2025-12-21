-- Add is_published and excerpt columns to wiki_pages
ALTER TABLE wiki_pages 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS excerpt TEXT;

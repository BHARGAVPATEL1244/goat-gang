-- Add new columns for the Enhanced Admin Manager and Hero Select UI

-- 1. Sort Order for custom ordering in Carousel
ALTER TABLE map_districts 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Trophy Counts (Gold, Silver, Bronze)
ALTER TABLE map_districts 
ADD COLUMN IF NOT EXISTS trophy_gold INTEGER DEFAULT 0;

ALTER TABLE map_districts 
ADD COLUMN IF NOT EXISTS trophy_silver INTEGER DEFAULT 0;

ALTER TABLE map_districts 
ADD COLUMN IF NOT EXISTS trophy_bronze INTEGER DEFAULT 0;

-- 3. Image URL for the Neighborhood (e.g. uploaded via bucket)
ALTER TABLE map_districts 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Cleanup old columns (uncomment if you are sure you want to delete them)
-- ALTER TABLE map_districts DROP COLUMN IF EXISTS q;
-- ALTER TABLE map_districts DROP COLUMN IF EXISTS r;
-- ALTER TABLE map_districts DROP COLUMN IF EXISTS type;
-- ALTER TABLE map_districts DROP COLUMN IF EXISTS leader_model;
-- ALTER TABLE map_districts DROP COLUMN IF EXISTS coleader_model;

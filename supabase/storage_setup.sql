-- 1. Create the 'images' bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts (renaming to be specific)
DROP POLICY IF EXISTS "Images Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Images Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Images Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Images Authenticated Delete" ON storage.objects;

-- 3. Enable Public Access (Read) for 'images' bucket
CREATE POLICY "Images Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'images' );

-- 4. Enable Upload Access for Authenticated Users for 'images' bucket
CREATE POLICY "Images Authenticated Uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'images' );

-- 5. Enable Update/Delete for Authenticated Users for 'images' bucket
CREATE POLICY "Images Authenticated Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'images' );

CREATE POLICY "Images Authenticated Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'images' );

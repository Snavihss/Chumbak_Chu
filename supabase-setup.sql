-- ============================================================
-- CHUMBAK CHU — Supabase Database Setup
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Create Characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  characteristics TEXT[] DEFAULT '{}',
  personality_images TEXT[] DEFAULT '{}',
  costume_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  visual_images TEXT[] DEFAULT '{}',
  lighting_tags TEXT[] DEFAULT '{}',
  lighting_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (optional — disable for simple usage)
-- If you want the app to work without authentication, disable RLS:
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies (allow all operations without auth)
-- Characters
CREATE POLICY "Allow all on characters" ON characters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Scenes
CREATE POLICY "Allow all on scenes" ON scenes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE SETUP (do this manually in the Supabase Dashboard):
--
-- 1. Go to Storage > Create a new bucket
-- 2. Name it: references
-- 3. Set it to PUBLIC
-- 4. Under Policies, create a policy that allows:
--    - SELECT (for viewing images)
--    - INSERT (for uploading images)
--    - DELETE (for removing images)
--    For all users (no auth required)
--
-- Or run these SQL commands:
-- ============================================================

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('references', 'references', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the bucket
CREATE POLICY "Public read references" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'references');

CREATE POLICY "Public insert references" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'references');

CREATE POLICY "Public delete references" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'references');

-- Add logo_url column to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN projects.logo_url IS 'URL to project logo/image (optional)';

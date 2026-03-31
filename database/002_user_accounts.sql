-- Migration: Add user accounts for voter registration
-- Run this in the Supabase SQL editor

-- 1. Create users table for voters (separate from admin_users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  votes_remaining INT NOT NULL DEFAULT 5,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add user_id column to votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 3. Drop the old fingerprint-based unique constraint
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_project_id_fingerprint_hash_key;

-- 4. Add user-based unique constraint (1 vote per project per user)
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_project_id_user_id_key;
ALTER TABLE votes ADD CONSTRAINT votes_project_id_user_id_key UNIQUE (project_id, user_id);

-- 5. Index for user vote lookups
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- 6. RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- No public access; backend uses service_role key which bypasses RLS

-- 7. Update votes RLS: allow authenticated inserts (backend validates via JWT)
DROP POLICY IF EXISTS "Public can insert votes" ON votes;
CREATE POLICY "Users can insert votes" ON votes
  FOR INSERT WITH CHECK (true);

-- Keep existing select policies for admin and realtime subscriptions

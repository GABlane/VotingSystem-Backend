-- Voting System Database Schema for Supabase
-- Fixed version

-- ========================================
-- 1. DROP EXISTING OBJECTS
-- ========================================

-- Drop functions with CASCADE (automatically drops dependent triggers).
-- Do NOT use DROP TRIGGER here — on a fresh DB the table won't exist yet,
-- and PostgreSQL throws 42P01 even with IF EXISTS when the table is missing.
DROP FUNCTION IF EXISTS update_project_vote_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ========================================
-- 2. CREATE TABLES
-- ========================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  qr_code_url TEXT,
  total_votes INTEGER DEFAULT 0,
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0)
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fingerprint_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT votes_project_fingerprint_unique UNIQUE(project_id, fingerprint_hash)
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ========================================
-- 3. INDEXES
-- ========================================

CREATE INDEX idx_votes_project_id ON votes(project_id);
CREATE INDEX idx_votes_fingerprint ON votes(fingerprint_hash);
CREATE INDEX idx_votes_voted_at ON votes(voted_at DESC);
CREATE INDEX idx_projects_active ON projects(is_active) WHERE is_active = true;
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- ========================================
-- 4. FUNCTIONS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_project_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET total_votes = total_votes + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET total_votes = GREATEST(total_votes - 1, 0) WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. TRIGGERS
-- ========================================

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vote_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_project_vote_count();

-- ========================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. RLS POLICIES
-- ========================================

-- PROJECTS
-- Public can only read active projects
CREATE POLICY "Public can read active projects" ON projects
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- NOTE: The service role in Supabase bypasses RLS entirely by default.
-- Do NOT add a permissive USING (true) policy — it will open access to anon/authenticated too.
-- Use the service_role key in your backend for full access; it needs no explicit policy.


-- VOTES
-- Anyone can cast a vote
CREATE POLICY "Anyone can insert a vote" ON votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read vote counts (needed for live tallies)
CREATE POLICY "Anyone can read votes" ON votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Deletes are restricted to authenticated users only (e.g. admin cleanup)
-- If you want only service_role to delete, remove this and use the service_role key.
CREATE POLICY "Authenticated users can delete votes" ON votes
  FOR DELETE
  TO authenticated
  USING (true);


-- ADMIN USERS
-- No public access at all. Access only via service_role key (bypasses RLS).
-- No policies needed — RLS enabled with no permissive policies = deny all anon/authenticated.


-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

GRANT SELECT ON projects TO anon, authenticated;
GRANT INSERT ON votes TO anon, authenticated;
GRANT SELECT ON votes TO anon, authenticated;
GRANT DELETE ON votes TO authenticated;

-- ========================================
-- 9. COMMENTS
-- ========================================

COMMENT ON TABLE projects IS 'Stores project information for voting';
COMMENT ON TABLE votes IS 'Records individual votes with fingerprint tracking';
COMMENT ON TABLE admin_users IS 'Stores admin user credentials — accessible via service_role key only';

COMMENT ON COLUMN projects.qr_code_url IS 'Data URL or storage URL for generated QR code';
COMMENT ON COLUMN projects.total_votes IS 'Cached vote count, auto-updated by trigger';
COMMENT ON COLUMN votes.fingerprint_hash IS 'SHA-256 hash of device fingerprint for deduplication';
COMMENT ON COLUMN votes.ip_address IS 'Voter IP address for analytics';

-- ========================================
-- SCHEMA COMPLETE
-- ========================================
-- Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
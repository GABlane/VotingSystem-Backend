# Database Setup

## Supabase Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - Project name: `voting-system`
   - Database password: (choose a strong password)
   - Region: (choose closest to your users)
5. Wait for the project to be created

### 2. Run the SQL Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Click "New Query"
3. Copy the entire content of `schema.sql` and paste it into the editor
4. Click "Run" or press `Cmd/Ctrl + Enter`
5. You should see a success message

### 3. Verify Tables Were Created

Run this query in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- `admin_users`
- `projects`
- `votes`

### 4. Enable Realtime

1. Go to **Database** → **Replication** in the Supabase dashboard
2. Find the `projects` table and toggle **Realtime** ON
3. Find the `votes` table and toggle **Realtime** ON

This enables real-time subscriptions for live vote updates.

### 5. Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

3. Add these to your `.env` file in the backend:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. (Optional) Create a Test Project

If you want to test the system, run this SQL query:

```sql
INSERT INTO projects (title, description, is_active)
VALUES (
  'Test Project 1',
  'This is a test project for development purposes',
  true
);
```

## Database Schema Overview

### Tables

**projects**
- Stores project information
- Auto-generates UUID as primary key
- Tracks total votes via trigger
- Has `is_active` flag to enable/disable projects

**votes**
- Records each vote with fingerprint hash
- Unique constraint on (project_id, fingerprint_hash) prevents duplicate votes
- Stores IP address and user agent for analytics
- Automatically updates project vote count via trigger

**admin_users**
- Stores admin credentials
- Passwords are hashed with bcrypt (done in backend)
- Email must be unique

### Security (RLS Policies)

- **Public users** can:
  - Read active projects
  - Cast votes
  - View vote counts

- **Service role** (backend) has full access to all tables

- **Admin users table** is only accessible via service role (backend)

### Triggers

- `update_projects_updated_at`: Automatically updates `updated_at` timestamp when project is modified
- `update_vote_count`: Automatically increments/decrements `total_votes` when votes are added/removed

## Troubleshooting

### Error: "relation 'projects' does not exist"
- Make sure you ran the schema.sql file
- Check you're in the correct project

### Error: "permission denied"
- Make sure RLS policies are enabled
- Verify you're using the correct API key (service_role for backend)

### Votes not updating in real-time
- Make sure you enabled Realtime replication for both `projects` and `votes` tables
- Check the Supabase Realtime docs: https://supabase.com/docs/guides/realtime

## Next Steps

After setting up the database:
1. Update your backend `.env` file with the Supabase credentials
2. Start the backend server: `npm run start:dev`
3. Test the connection by making API calls to the backend

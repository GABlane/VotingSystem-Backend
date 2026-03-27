# QR Voting System - Backend API

NestJS REST API for a real-time QR code voting system with JWT authentication, file uploads, and Supabase integration.

## Tech Stack

- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Supabase** - PostgreSQL database + Storage
- **JWT** - Authentication with `@nestjs/jwt`
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **QRCode** - QR code generation
- **Class Validator** - DTO validation

## Features

- 🔐 JWT-based authentication
- 📊 Project CRUD operations
- 🎨 File upload (project logos) to Supabase Storage
- 📱 QR code generation (base64 data URLs)
- 🗳️ Vote tracking with duplicate prevention
- 👤 Browser fingerprinting
- ⚡ Real-time updates (via Supabase Realtime)

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with:
  - PostgreSQL database
  - Storage bucket named `project-logos` (public)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the backend root:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # JWT with role:"service_role"
SUPABASE_ANON_KEY=eyJhbGc...          # JWT with role:"anon"

# JWT Secret (use strong random string)
JWT_SECRET=your-very-secure-secret-key-min-32-chars

# Frontend URL (for CORS and QR codes)
FRONTEND_URL=http://localhost:3000

# Server Port
PORT=3001
```

### Important: Supabase Keys
Make sure the keys are correctly assigned:
- **SERVICE_ROLE_KEY**: JWT with `"role":"service_role"` (bypasses RLS)
- **ANON_KEY**: JWT with `"role":"anon"` (respects RLS policies)

You can decode the JWTs at [jwt.io](https://jwt.io) to verify.

## Database Setup

### Tables Required

Run these SQL commands in your Supabase SQL editor:

```sql
-- Admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  fingerprint_id UUID REFERENCES fingerprints(id),
  ip_address VARCHAR(45),
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, fingerprint_id)
);

-- Fingerprints table
CREATE TABLE fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update trigger for projects.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Storage Bucket

Create a storage bucket in Supabase Dashboard:
1. Go to Storage section
2. Create new bucket: `project-logos`
3. Set to **Public**
4. Add RLS policy for public read access:

```sql
CREATE POLICY "Public can read project logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-logos');
```

## Seeding Admin User

Create the default admin account:

```bash
node scripts/seed-admin.js
```

**Default credentials:**
- Email: `admin@voting.com`
- Password: `admin123456`

**⚠️ Change this password in production!**

## Running the App

### Development Mode
```bash
npm run start:dev
```

Server runs on `http://localhost:3001`

### Production Build
```bash
npm run build
npm run start:prod
```

### Watch Mode (with auto-restart)
```bash
npm run start:dev
```

## API Endpoints

### Authentication

#### Register Admin
```http
POST /auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@voting.com",
  "password": "admin123456"
}

Response:
{
  "access_token": "eyJhbGc..."
}
```

### Projects (Public)

#### List Active Projects
```http
GET /projects
```

#### Get Single Project
```http
GET /projects/:id
```

#### Get Voting Results
```http
GET /projects/:id/results

Response:
{
  "project": { ... },
  "votes": [...],
  "vote_count": 42
}
```

### Projects (Admin - Requires JWT)

#### Create Project
```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Project",
  "description": "Project description"
}
```

QR code is automatically generated and stored.

#### Update Project
```http
PATCH /projects/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "is_active": true
}
```

#### Delete Project
```http
DELETE /projects/:id
Authorization: Bearer {token}
```

#### Upload Project Logo
```http
POST /projects/:id/upload-logo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- logo: (file)
```

**Constraints:**
- Max file size: 5MB
- Allowed types: jpg, jpeg, png, gif, webp

#### Regenerate QR Code
```http
POST /projects/:id/regenerate-qr
Authorization: Bearer {token}

Response:
{
  "qr_code_url": "data:image/png;base64,..."
}
```

#### Download High-Res QR Code
```http
GET /projects/:id/qr/print
Authorization: Bearer {token}

Response: PNG image file (1000x1000px)
```

### Votes

#### Cast Vote
```http
POST /votes/:projectId
Content-Type: application/json

{
  "fingerprint": "browser-fingerprint-hash"
}

Response:
{
  "message": "Vote recorded successfully"
}
```

Returns `409 Conflict` if already voted.

#### Check Vote Status
```http
GET /votes/:projectId/check?fingerprint={hash}

Response:
{
  "hasVoted": true
}
```

## Project Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts    # Login/register endpoints
│   │   ├── auth.service.ts       # JWT + bcrypt logic
│   │   ├── dto/                  # Login/register DTOs
│   │   └── strategies/           # JWT strategy
│   │
│   ├── projects/
│   │   ├── projects.controller.ts  # Project endpoints
│   │   ├── projects.service.ts     # CRUD + file upload
│   │   └── dto/                    # Create/update DTOs
│   │
│   ├── votes/
│   │   ├── votes.controller.ts   # Vote endpoints
│   │   └── votes.service.ts      # Vote logic + duplicates
│   │
│   ├── qr/
│   │   └── qr.service.ts         # QR code generation
│   │
│   ├── fingerprint/
│   │   └── fingerprint.service.ts  # Fingerprint tracking
│   │
│   ├── common/
│   │   └── guards/
│   │       └── jwt-auth.guard.ts  # JWT authentication guard
│   │
│   ├── config/
│   │   └── supabase.config.ts    # Supabase client
│   │
│   └── main.ts                   # Bootstrap + CORS
│
├── scripts/
│   └── seed-admin.js             # Admin seeding script
│
├── .env                          # Environment variables
└── package.json
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Common Issues

### Port Already in Use
```bash
lsof -ti:3001 | xargs kill -9
```

### Supabase RLS Errors
- Verify you're using SERVICE_ROLE_KEY (not ANON_KEY) for admin operations
- Check key assignment: decode JWT at jwt.io

### File Upload Fails
- Verify `project-logos` bucket exists
- Ensure bucket is set to public
- Check RLS policy allows public reads

### QR Code Not Generated
- Check FRONTEND_URL is set correctly
- Verify QR service is registered in module
- Check project creation logs for errors

## Security

### Current Implementation
- ✅ JWT authentication for admin routes
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ CORS restricted to frontend origin
- ✅ File upload validation (size, type)
- ✅ Browser fingerprinting for vote tracking
- ✅ Unique constraint on votes (prevents duplicates)

### Production Recommendations
- Change default admin password
- Use strong JWT_SECRET (32+ random characters)
- Enable HTTPS only
- Implement rate limiting (e.g., `@nestjs/throttler`)
- Add helmet for security headers
- Set up monitoring and logging
- Review and tighten CORS settings
- Implement input sanitization for XSS prevention

## Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start:prod
```

### Environment Variables for Production
Update `.env` with production values:
- Set `FRONTEND_URL` to your Vercel domain
- Use strong, random `JWT_SECRET`
- Verify Supabase keys are correct

### Deployment Platforms
Recommended: **Railway**, **Render**, or **Fly.io**

1. Push code to GitHub
2. Connect hosting platform to repo
3. Set environment variables
4. Deploy!

## License

MIT

## Support

For issues or questions, check the main project README or CLAUDE.md.

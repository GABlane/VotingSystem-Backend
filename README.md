# Voting System Backend (NestJS)

QR code-based voting system backend built with NestJS and Supabase.

## Features

- QR code generation for projects
- Anonymous vote tracking (device fingerprint + IP)
- Real-time vote updates via Supabase
- JWT-based admin authentication
- Rate limiting and security headers
- RESTful API

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase project credentials:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings → API)
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `JWT_SECRET`: Change to a secure random string in production

### 3. Setup Database

Run the SQL schema located in `/database/schema.sql` in your Supabase SQL editor to create the required tables.

### 4. Run Development Server

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

The backend will run on `http://localhost:3001`

## API Endpoints

### Public Endpoints

- `GET /projects` - List all active projects
- `GET /projects/:id` - Get project details
- `POST /votes/:projectId` - Cast a vote
- `GET /votes/:projectId/check` - Check if user already voted

### Admin Endpoints (Requires JWT)

- `POST /auth/login` - Admin login
- `POST /auth/register` - Create admin account
- `POST /projects` - Create a new project
- `PATCH /projects/:id` - Update a project
- `DELETE /projects/:id` - Delete a project
- `GET /projects/:id/results` - Get voting results

## Project Structure

```
src/
├── auth/           # JWT authentication
├── projects/       # Project CRUD operations
├── votes/          # Vote casting and validation
├── qr/             # QR code generation
├── fingerprint/    # Device fingerprint hashing
├── common/         # Guards, decorators, filters
└── config/         # Configuration files
```

## Technologies

- **NestJS** - Backend framework
- **Supabase** - PostgreSQL database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **qrcode** - QR code generation
- **Helmet** - Security headers
- **Throttler** - Rate limiting

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

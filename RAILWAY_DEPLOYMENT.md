# Railway Deployment Guide

Complete guide for deploying the NestJS backend to Railway.

## Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Backend code pushed to GitHub
- Supabase database set up

## Files for Railway

The following files configure Railway deployment:

- ✅ `Procfile` - Start command
- ✅ `nixpacks.toml` - Build configuration
- ✅ `railway.json` - Railway settings
- ✅ `.railwayignore` - Files to exclude

## Step-by-Step Deployment

### 1. Push Code to GitHub

```bash
cd backend

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add remote and push
git remote add origin https://github.com/yourusername/voting-backend.git
git branch -M main
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your backend repository
6. Railway will automatically detect it as a Node.js app

### 3. Configure Environment Variables

In your Railway project dashboard, go to **Variables** tab and add:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secure-random-secret-key-at-least-32-chars

# Frontend URL (will update this later with Vercel URL)
FRONTEND_URL=https://your-app.vercel.app

# Port (Railway automatically provides this, but you can set it)
PORT=3001
```

**Important:** Don't use quotes around values in Railway variables.

### 4. Deploy

Railway will automatically deploy after adding environment variables.

**Deployment steps:**
1. Railway detects `nixpacks.toml` configuration
2. Runs `npm install`
3. Runs `npm run build`
4. Starts with `npm run start:prod`

### 5. Get Your Railway URL

After deployment succeeds:
1. Go to **Settings** tab
2. Scroll to **Networking** section
3. Click **Generate Domain**
4. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

### 6. Update CORS Settings

Update `src/main.ts` in your backend code to allow your frontend URL:

```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000', // for local development
  ],
  credentials: true,
});
```

Commit and push the changes - Railway will auto-redeploy.

### 7. Test the Deployment

Test your deployed API:

```bash
# Health check
curl https://your-app.up.railway.app

# List projects
curl https://your-app.up.railway.app/projects

# Login
curl -X POST https://your-app.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@voting.com","password":"admin123456"}'
```

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase | JWT with role:"service_role" |
| `SUPABASE_ANON_KEY` | Anonymous key from Supabase | JWT with role:"anon" |
| `JWT_SECRET` | Secret for signing JWT tokens | 32+ random characters |
| `FRONTEND_URL` | Your frontend URL (for CORS + QR codes) | `https://app.vercel.app` |
| `PORT` | Server port (Railway auto-assigns) | `3001` |

## Getting Supabase Keys

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon)
3. Click **API** section
4. Copy:
   - **URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ Never expose service_role key in frontend!**

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to **Deployments** tab
2. Click failed deployment
3. Check build logs for errors

**Common issues:**
- Missing dependencies → Run `npm install` locally first
- TypeScript errors → Fix with `npm run build` locally
- Node version mismatch → Specify in `nixpacks.toml`

### App Crashes on Start

**Check runtime logs:**
1. Go to **Deployments** tab
2. Click current deployment
3. View runtime logs

**Common issues:**
- Missing env vars → Check all variables are set
- Supabase connection fails → Verify keys are correct
- Port binding issues → Railway handles this automatically

### CORS Errors

If frontend can't connect:
1. Check `FRONTEND_URL` matches your Vercel domain exactly
2. Verify CORS is enabled in `main.ts`
3. Check Railway logs for request rejections

### 502 Bad Gateway

This usually means the app isn't starting:
1. Check runtime logs for errors
2. Verify `start:prod` script works locally
3. Check `dist/main.js` exists after build

## Monitoring

### View Logs
```bash
# In Railway dashboard
Deployments → Current deployment → View logs
```

### Metrics
Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request count

### Restart Service
If needed:
1. Go to **Settings** tab
2. Scroll to **Service** section
3. Click **Restart**

## Custom Domain (Optional)

To use your own domain:
1. Go to **Settings** → **Networking**
2. Click **Custom Domain**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed
5. Railway auto-provisions SSL certificate

## Scaling

### Vertical Scaling (More resources)
1. Go to **Settings** → **Resources**
2. Adjust CPU and memory limits

### Horizontal Scaling (Multiple instances)
Edit `railway.json`:
```json
{
  "deploy": {
    "numReplicas": 2
  }
}
```

**Note:** Free tier limited to 1 replica.

## CI/CD

Railway auto-deploys on every push to `main` branch.

**Disable auto-deploy:**
1. Go to **Settings** → **Service**
2. Toggle off **Auto Deploy**

**Manual deploy:**
1. Push to GitHub
2. In Railway, click **Deploy**

## Pricing

**Free Tier:**
- $5 credit per month
- 500 hours runtime
- 512MB RAM
- 1GB disk

**Upgrade for:**
- More resources
- Custom domains
- Multiple replicas
- Priority support

Check [railway.app/pricing](https://railway.app/pricing) for details.

## Security Checklist

Before going live:
- [ ] Strong `JWT_SECRET` set (32+ random chars)
- [ ] Default admin password changed
- [ ] Service role key not exposed
- [ ] HTTPS enabled (automatic on Railway)
- [ ] CORS restricted to frontend domain only
- [ ] Supabase RLS policies reviewed
- [ ] Environment variables set correctly
- [ ] No secrets in code/commits

## Next Steps

After backend is deployed:
1. ✅ Copy Railway URL
2. Deploy frontend to Vercel
3. Set `NEXT_PUBLIC_API_URL` to Railway URL
4. Update `FRONTEND_URL` on Railway to Vercel URL
5. Test end-to-end flow

## Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **Railway Status:** [status.railway.app](https://status.railway.app)

## Quick Reference

```bash
# View logs
railway logs

# Link to existing project
railway link

# Run commands in Railway environment
railway run node scripts/seed-admin.js

# Check environment variables
railway variables
```

---

**Ready to deploy?** Follow the steps above and your backend will be live in minutes! 🚀

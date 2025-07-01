# Deployment Guide - FirstDevJob 🚀

This guide covers deploying FirstDevJob to various platforms and environments, from development to production.

## 🎯 Quick Deploy Options

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Ffirstdevjob)

### Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/Z8wVL2)

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/firstdevjob)

## 🔧 Environment Configuration

### Required Environment Variables

Create `.env.local` for development or configure in your deployment platform:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Configuration (Required for production)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional: Vercel-specific
NEXT_PUBLIC_VERCEL_URL=your-app.vercel.app
```

### Environment Variable Details

#### **NEXT_PUBLIC_SUPABASE_URL**
- **Purpose**: Supabase project URL
- **Where to find**: Supabase Dashboard → Settings → API
- **Example**: `https://abcdefghijklmnop.supabase.co`

#### **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Purpose**: Public anon key for client-side Supabase operations
- **Where to find**: Supabase Dashboard → Settings → API
- **Security**: Safe to expose publicly (RLS protects data)

#### **SUPABASE_SERVICE_ROLE_KEY**
- **Purpose**: Server-side admin operations (user deletion, bypassing RLS)
- **Where to find**: Supabase Dashboard → Settings → API
- **Security**: **NEVER expose publicly** - server-side only

#### **NEXT_PUBLIC_SITE_URL**
- **Purpose**: Base URL for OAuth redirects and email links
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

## 🌐 Vercel Deployment

### Automatic Deployment

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Import in Vercel**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your FirstDevJob repository
   - Vercel auto-detects Next.js configuration

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables
   - Deploy

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Follow prompts to configure project
# Set environment variables when prompted
```

### Vercel Configuration

#### `vercel.json` (optional)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "src/app/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### Domain Configuration
```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www → your-app.vercel.app
# Add A record: @ → 76.76.19.61
```

## 🚄 Railway Deployment

### One-Click Deploy
1. Click the Railway button above
2. Connect your GitHub account
3. Configure environment variables
4. Deploy

### Manual Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL="your-url"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Deploy
railway up
```

### Railway Configuration

#### `railway.toml`
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[[services]]
name = "firstdevjob"
```

## 🌊 Netlify Deployment

### Site Configuration

#### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Setup
1. Connect repository to Netlify
2. Go to Site Settings → Environment Variables
3. Add all required environment variables
4. Trigger new deploy

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  firstdevjob:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - firstdevjob
    restart: unless-stopped
```

### Build and Run
```bash
# Build image
docker build -t firstdevjob .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your-url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
  -e NEXT_PUBLIC_SITE_URL="https://yourdomain.com" \
  firstdevjob

# Using Docker Compose
docker-compose up -d
```

## ☁️ Self-Hosting Options

### VPS/Server Deployment

#### Prerequisites
- **Node.js 18+** installed
- **PM2** for process management
- **Nginx** for reverse proxy
- **SSL certificate** (Let's Encrypt recommended)

#### Setup Process
```bash
# 1. Clone repository
git clone https://github.com/yourusername/firstdevjob.git
cd firstdevjob

# 2. Install dependencies
npm ci --only=production

# 3. Set environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Build application
npm run build

# 5. Install PM2
npm install -g pm2

# 6. Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'firstdevjob',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/firstdevjob',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/firstdevjob-error.log',
    out_file: '/var/log/pm2/firstdevjob-out.log',
    log_file: '/var/log/pm2/firstdevjob.log',
    time: true
  }]
}
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🗄️ Database Setup

### Supabase Project Creation

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Choose region close to your users

2. **Run Database Schema**
   - Copy SQL from `docs/database.md`
   - Go to SQL Editor in Supabase Dashboard
   - Execute the schema setup queries

3. **Configure Authentication**
   - Go to Authentication → Settings
   - Set Site URL to your domain
   - Configure OAuth providers (optional):
     - Google: Add OAuth credentials
     - GitHub: Add OAuth app credentials

4. **Set Up RLS Policies**
   - All policies are included in database.md
   - Test policies with different user roles

### Database Migration Script

Create `scripts/setup-database.sql`:
```sql
-- Run this in Supabase SQL Editor

-- 1. Create custom types
CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE job_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE application_status AS ENUM (
  'saved', 'applied', 'interviewing', 'offer', 'rejected', 'accepted'
);

-- 2. Create tables (see docs/database.md for full schema)

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ... (continue for all tables)

-- 4. Create policies (see docs/database.md for all policies)
```

## 🔒 Production Security Checklist

### Environment Security
- [ ] **Environment variables** are properly set
- [ ] **Service role key** is kept secret
- [ ] **HTTPS** is enforced
- [ ] **CORS** is properly configured

### Database Security
- [ ] **RLS is enabled** on all tables
- [ ] **Policies are tested** for each role
- [ ] **Service key usage** is minimal and secure
- [ ] **Backup strategy** is in place

### Application Security
- [ ] **Authentication flows** work correctly
- [ ] **OAuth redirects** are properly configured
- [ ] **Error messages** don't leak sensitive info
- [ ] **Input validation** is comprehensive

### Infrastructure Security
- [ ] **SSL certificates** are valid and auto-renewing
- [ ] **Firewall rules** are properly configured
- [ ] **Security headers** are set
- [ ] **Rate limiting** is implemented (if needed)

## 📊 Monitoring & Analytics

### Recommended Tools

#### **Vercel Analytics** (if using Vercel)
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  }
}
```

#### **Supabase Monitoring**
- Database performance metrics
- Auth conversion rates
- API usage tracking
- Error rates and logs

#### **Custom Analytics**
```typescript
// Track job applications
export async function trackJobApplication(jobId: number) {
  // Send to your analytics platform
  analytics.track('Job Application Started', {
    jobId,
    timestamp: new Date().toISOString()
  })
}
```

### Health Checks

#### **API Health Check**
```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .select('id')
      .limit(1)
    
    if (error) throw error
    
    return Response.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

#### **Uptime Monitoring**
Set up monitoring with:
- **UptimeRobot** - Free uptime monitoring
- **Pingdom** - Advanced monitoring and alerts
- **StatusPage** - Status page for users

## 🚀 Performance Optimization

### Build Optimization

#### **Next.js Configuration**
```javascript
// next.config.js
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true
  },
  images: {
    formats: ['image/webp', 'image/avif']
  },
  compress: true
}
```

#### **Bundle Analysis**
```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
npx @next/bundle-analyzer
```

### Runtime Optimization

#### **Caching Strategy**
```typescript
// Set up ISR for job listings
export const revalidate = 3600 // 1 hour

// Cache API responses
const jobsCache = new Map()

export async function getCachedJobs() {
  const cacheKey = 'approved-jobs'
  
  if (jobsCache.has(cacheKey)) {
    return jobsCache.get(cacheKey)
  }
  
  const jobs = await fetchJobs()
  jobsCache.set(cacheKey, jobs)
  
  // Expire cache after 10 minutes
  setTimeout(() => jobsCache.delete(cacheKey), 10 * 60 * 1000)
  
  return jobs
}
```

#### **Database Optimization**
- **Indexes** on frequently queried columns
- **Query optimization** with EXPLAIN ANALYZE
- **Connection pooling** for high traffic

## 🔄 CI/CD Pipeline

### GitHub Actions

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type check
      run: npx tsc --noEmit
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### Pre-deploy Checklist
- [ ] Tests pass locally
- [ ] Environment variables are set
- [ ] Database migrations applied
- [ ] Build completes successfully
- [ ] Performance impact assessed

## 🆘 Troubleshooting

### Common Issues

#### **Build Failures**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### **Database Connection Issues**
```typescript
// Test Supabase connection
const supabase = createClient()
const { data, error } = await supabase
  .from('jobs')
  .select('count(*)')

console.log({ data, error })
```

#### **Authentication Problems**
- Check OAuth redirect URLs
- Verify environment variables
- Test with incognito mode
- Check Supabase auth logs

#### **RLS Policy Issues**
```sql
-- Check current user context
SELECT auth.uid(), auth.role();

-- Test policy directly
SELECT * FROM jobs WHERE status = 'approved';
```

### Getting Help

1. **Check logs** in your deployment platform
2. **Review Supabase logs** for database issues
3. **Test locally** with production environment variables
4. **Create GitHub issue** with detailed error information

---

This deployment guide covers most production scenarios for FirstDevJob. Choose the platform that best fits your needs and budget. For additional help, refer to the platform-specific documentation or create an issue in the repository. 
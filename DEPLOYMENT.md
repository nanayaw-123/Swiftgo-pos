# SwiftPOS Deployment Guide

## Pre-Deployment Checklist

### 1. Code Verification ✓
- [x] All features implemented
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] All imports resolved
- [x] Environment variables templated

### 2. Dependencies ✓
- [x] All packages installed
- [x] Package.json up to date
- [x] No security vulnerabilities
- [x] Lock file committed

### 3. Configuration ✓
- [x] Middleware configured
- [x] Route protection set up
- [x] API routes secured
- [x] CORS configured (if needed)

## Deployment Steps

### Option A: Deploy to Vercel (Recommended)

#### Step 1: Prepare Repository

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - SwiftPOS complete"

# Create GitHub repository
# Then push
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

#### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Select your SwiftPOS repository
5. Click "Import"

#### Step 3: Configure Environment Variables

In Vercel project settings, add these environment variables:

**Clerk:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

**Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Polar (Optional):**
```
POLAR_API_KEY=polar_...
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=org_...
```

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployment URL

#### Step 5: Update Clerk Settings

1. Go to Clerk dashboard
2. Update allowed domains to include your Vercel URL
3. Update redirect URLs to production URLs

### Option B: Self-Hosted Deployment

#### Requirements
- Node.js 18+
- PostgreSQL database (or Supabase)
- Domain with SSL

#### Step 1: Build Application

```bash
npm install
npm run build
```

#### Step 2: Set Environment Variables

Create `.env.production`:
```env
# Same as .env.local but with production values
```

#### Step 3: Start Server

```bash
npm start
# Or with PM2
pm2 start npm --name "swiftpos" -- start
```

#### Step 4: Configure Reverse Proxy

Nginx example:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment Checklist

### 1. Verify Core Features

- [ ] Landing page loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] Onboarding completes
- [ ] Dashboard loads
- [ ] Products can be created
- [ ] POS terminal works
- [ ] Sales process correctly
- [ ] Real-time updates work
- [ ] Offline mode functions

### 2. Database Configuration

- [ ] Migrations run successfully
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Backups enabled
- [ ] Connection pooling configured

### 3. Security Verification

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] API keys not exposed
- [ ] RLS policies tested
- [ ] Authentication required
- [ ] CORS configured properly

### 4. Performance Optimization

- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Caching configured
- [ ] CDN enabled
- [ ] Database queries optimized

### 5. Monitoring Setup

- [ ] Error tracking configured
- [ ] Analytics installed
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Performance monitoring

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Staging
```env
NODE_ENV=production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Production
```env
NODE_ENV=production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

## Database Migration Strategy

### Initial Setup

1. Run migrations in Supabase SQL editor:
   ```sql
   -- Run in order:
   -- 001_initial_schema.sql
   -- 002_rls_policies.sql
   -- 003_stock_functions.sql
   ```

2. Verify tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. Verify RLS enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

### Rollback Plan

If deployment fails:
1. Revert to previous Git commit
2. Redeploy previous version
3. Restore database backup
4. Investigate issues in staging

## Scaling Considerations

### Database
- **<1000 users:** Free Supabase tier
- **1000-10000 users:** Supabase Pro ($25/mo)
- **>10000 users:** Supabase Enterprise

### Hosting
- **Development:** Vercel Hobby (free)
- **Small Business:** Vercel Pro ($20/mo)
- **Enterprise:** Vercel Enterprise

### Storage
- **Products:** Supabase Storage
- **Receipts:** Supabase Storage or S3
- **Backups:** Automatic with Supabase

## Maintenance

### Weekly
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Monitor disk usage
- [ ] Check backup status

### Monthly
- [ ] Security updates
- [ ] Dependency updates
- [ ] Database optimization
- [ ] Cost analysis

### Quarterly
- [ ] Feature review
- [ ] User feedback analysis
- [ ] Performance audit
- [ ] Security audit

## Troubleshooting

### Build Errors

**"Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**"Type errors"**
```bash
npm run type-check
# Fix errors and rebuild
```

### Runtime Errors

**"Unauthorized"**
- Check Clerk keys are correct
- Verify middleware is working
- Check RLS policies

**"Database connection failed"**
- Verify Supabase URL
- Check connection limits
- Review RLS policies

**"Offline mode not working"**
- Check IndexedDB support
- Verify Dexie initialization
- Check browser console

## Backup Strategy

### Database Backups
- **Frequency:** Daily automatic (Supabase)
- **Retention:** 7 days (free tier)
- **Manual:** Before major changes

### Code Backups
- **Git:** All code in version control
- **GitHub:** Remote repository
- **Branches:** main, develop, staging

### Data Export
```sql
-- Export tenants
COPY (SELECT * FROM tenants) TO '/tmp/tenants.csv' CSV HEADER;

-- Export products
COPY (SELECT * FROM products) TO '/tmp/products.csv' CSV HEADER;

-- Export sales
COPY (SELECT * FROM sales) TO '/tmp/sales.csv' CSV HEADER;
```

## Monitoring URLs

After deployment, monitor these:

- **Application:** https://your-domain.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Clerk Dashboard:** https://dashboard.clerk.com

## Success Metrics

### Technical
- Uptime: >99.9%
- Response time: <300ms
- Error rate: <0.1%
- Build time: <3 minutes

### Business
- User signups
- Daily active users
- Sales volume
- Revenue

## Support

### Getting Help
1. Check logs in Vercel
2. Review Supabase logs
3. Check Clerk status
4. Consult documentation
5. Contact support

### Emergency Contacts
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com
- Clerk Support: support@clerk.com

## Post-Launch Tasks

### Immediate (Day 1)
- [ ] Monitor error logs
- [ ] Test all features
- [ ] Check performance
- [ ] Verify emails working
- [ ] Test payments (if enabled)

### Week 1
- [ ] User onboarding metrics
- [ ] Feature usage analytics
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] User feedback collection

### Month 1
- [ ] Feature requests prioritization
- [ ] A/B testing setup
- [ ] Marketing integration
- [ ] Customer support setup
- [ ] Documentation updates

## Deployment Commands

```bash
# Check build locally
npm run build
npm start

# Deploy to Vercel (via Git)
git push origin main

# Manual Vercel deployment
vercel --prod

# Database migrations
# Run in Supabase SQL editor

# Environment variables
vercel env add VARIABLE_NAME production
```

## Congratulations! 🎉

Your SwiftPOS application is now deployed and ready for production use!

Next steps:
1. Share with team
2. Onboard first users
3. Gather feedback
4. Iterate and improve

For questions or issues, refer to:
- README.md
- SETUP_GUIDE.md
- ARCHITECTURE.md
- GitHub Issues

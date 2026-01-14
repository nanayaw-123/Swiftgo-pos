# SwiftPOS Setup Guide

Complete step-by-step guide to get SwiftPOS running.

## Prerequisites

- Node.js 18+ installed
- A Clerk account (free tier available)
- A Supabase account (free tier available)
- Git installed

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- Clerk for authentication
- Supabase client
- Shadcn UI components
- And all other dependencies

## Step 2: Set Up Clerk Authentication

### 2.1 Create Clerk Application

1. Go to https://clerk.com
2. Sign up or log in
3. Click "Add application"
4. Choose your application name (e.g., "SwiftPOS")
5. Select authentication methods (Email recommended)
6. Click "Create application"

### 2.2 Get Clerk API Keys

1. In your Clerk dashboard, go to "API Keys"
2. Copy the following:
   - Publishable Key
   - Secret Key

### 2.3 Configure Clerk URLs

1. In Clerk dashboard, go to "Paths"
2. Set the following paths:
   - Sign-in: `/sign-in`
   - Sign-up: `/sign-up`
   - After sign-in: `/onboarding`
   - After sign-up: `/onboarding`

## Step 3: Set Up Supabase Database

### 3.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New project"
4. Fill in:
   - Project name: "swiftpos"
   - Database password: (save this securely)
   - Region: (choose closest to you)
5. Click "Create new project"
6. Wait for project to be ready (~2 minutes)

### 3.2 Get Supabase Keys

1. In your Supabase dashboard, click "Settings" (gear icon)
2. Go to "API" section
3. Copy the following:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

### 3.3 Run Database Migrations

1. In Supabase dashboard, click "SQL Editor"
2. Click "New query"
3. Copy content from `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. Repeat for:
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_stock_functions.sql`

**Important:** Run migrations in order!

## Step 4: Configure Environment Variables

### 4.1 Create .env.local File

Create a new file named `.env.local` in the root directory:

```bash
touch .env.local
```

### 4.2 Add Environment Variables

Copy this template and fill in your values:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Polar (Optional - for production payments)
POLAR_API_KEY=your_polar_api_key
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=your_polar_organization_id
```

## Step 5: Start Development Server

```bash
npm run dev
```

The application will start on http://localhost:3000

## Step 6: Test the Application

### 6.1 Create First Account

1. Open http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Create an account with email/password
4. You'll be redirected to onboarding

### 6.2 Complete Onboarding

Fill in:
- Business Name: "Test Store"
- Store Name: "Main Location"
- Location: "123 Main St"
- Subscription: "Free"

Click "Complete Setup"

### 6.3 Add Sample Products

1. Go to Dashboard → Products
2. Click "Add Product"
3. Fill in:
   - Name: "Sample Product"
   - SKU: "PROD-001"
   - Price: 9.99
   - Stock: 100
   - Category: "General"
4. Click "Create"

### 6.4 Test POS Terminal

1. Click "POS Terminal" in sidebar
2. Select your store
3. Click on a product to add to cart
4. Click "Cash" to complete sale
5. Check Dashboard for updated stats

## Troubleshooting

### "Unauthorized" Error
- Check that Clerk keys are correct
- Ensure you're signed in
- Clear browser cookies and try again

### Database Connection Error
- Verify Supabase URL and keys
- Check that migrations ran successfully
- Ensure RLS policies are enabled

### Product Not Found in POS
- Check that product was created successfully
- Refresh the page
- Check browser console for errors

### Offline Mode Not Working
- Check browser IndexedDB support
- Clear IndexedDB and try again
- Check browser console for errors

## Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your repository
5. Add all environment variables
6. Click "Deploy"

### Environment Variables for Production

Make sure to add all variables from `.env.local` to Vercel:
- All Clerk variables
- All Supabase variables
- Change Clerk keys to production keys
- Change Supabase keys to production keys

## Next Steps

1. **Customize Branding:** Edit colors in `src/app/globals.css`
2. **Add More Products:** Build your product catalog
3. **Invite Team:** Add managers and cashiers
4. **Set Up Payments:** Configure Polar for subscriptions
5. **Configure Webhooks:** Set up Clerk webhooks for user management
6. **Enable Realtime:** Test realtime features with multiple devices

## Security Checklist

- [ ] Changed all default passwords
- [ ] Secured service role key (never expose to client)
- [ ] Enabled RLS on all tables
- [ ] Configured CORS properly
- [ ] Set up proper backups
- [ ] Enabled 2FA on admin accounts
- [ ] Reviewed audit logs regularly

## Support

If you encounter issues:
1. Check this guide again
2. Review error messages in console
3. Check Supabase logs
4. Check Clerk logs
5. Open a GitHub issue

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Database Management

### Backup Database

In Supabase:
1. Go to Settings → Database
2. Click "Backup" tab
3. Create manual backup

### Reset Database

To start fresh:
1. Run migrations again
2. Or use Supabase "Reset Database" option

### View Tables

1. Go to Supabase → Table Editor
2. View and edit data directly

## Success Indicators

You'll know everything is working when:
- ✅ Landing page loads
- ✅ Sign up creates account
- ✅ Onboarding creates tenant
- ✅ Dashboard shows stats
- ✅ Products can be added
- ✅ POS can process sales
- ✅ Offline mode works
- ✅ Realtime updates work

Congratulations! Your SwiftPOS is now ready to use! 🎉

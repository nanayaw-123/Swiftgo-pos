# SwiftPOS - Quick Start Guide

Get SwiftPOS running in **15 minutes**! ⚡

## Prerequisites Checklist

Before you start, make sure you have:
- [ ] Node.js 18+ installed
- [ ] A Clerk account (free) → [clerk.com](https://clerk.com)
- [ ] A Supabase account (free) → [supabase.com](https://supabase.com)
- [ ] A code editor (VS Code recommended)
- [ ] Git installed

---

## Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

**Expected output:** `installed [packages] in [time]`

---

## Step 2: Setup Clerk (3 minutes)

### 2.1 Create Application
1. Go to https://clerk.com
2. Click "Add application"
3. Name: "SwiftPOS"
4. Enable: Email authentication
5. Click "Create"

### 2.2 Get Keys
1. In dashboard, go to "API Keys"
2. Copy:
   - Publishable Key (starts with `pk_test_`)
   - Secret Key (starts with `sk_test_`)

### 2.3 Configure Paths
1. Go to "Paths" in sidebar
2. Set:
   - Sign-in: `/sign-in`
   - Sign-up: `/sign-up`
   - After sign-in: `/onboarding`
   - After sign-up: `/onboarding`

---

## Step 3: Setup Supabase (4 minutes)

### 3.1 Create Project
1. Go to https://supabase.com
2. Click "New project"
3. Enter:
   - Name: `swiftpos`
   - Password: (save this!)
   - Region: (closest to you)
4. Click "Create" (takes ~2 mins)

### 3.2 Get Keys
1. Click Settings → API
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)

### 3.3 Run Migrations
1. Click "SQL Editor"
2. Click "New query"
3. Open `supabase/migrations/001_initial_schema.sql`
4. Copy all content, paste, click "Run"
5. Repeat for:
   - `002_rls_policies.sql`
   - `003_stock_functions.sql`

**Verify:** Click "Table Editor" - you should see 9 tables

---

## Step 4: Configure Environment (2 minutes)

Create `.env.local` file in root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Replace:** YOUR_KEY with actual keys from steps 2 & 3

---

## Step 5: Launch App (1 minute)

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.x
✓ Ready in XXXms
○ Local: http://localhost:3000
```

Open: http://localhost:3000

---

## Step 6: Test Features (3 minutes)

### 6.1 Create Account
1. Click "Get Started"
2. Enter email & password
3. Verify email (check inbox)

### 6.2 Complete Onboarding
1. Business Name: "Test Store"
2. Store Name: "Main Location"
3. Location: "123 Main St"
4. Plan: "Free"
5. Click "Complete Setup"

### 6.3 Add Sample Product
1. Go to Products (sidebar)
2. Click "Add Product"
3. Fill in:
   - Name: "Sample Product"
   - SKU: "PROD-001"
   - Price: 9.99
   - Stock: 100
   - Category: "General"
4. Click "Create"

### 6.4 Test POS
1. Click "POS Terminal" (sidebar)
2. Click on your product
3. Click "Cash" to checkout
4. Success! 🎉

---

## ✅ Success Checklist

You should now have:
- [x] App running on localhost:3000
- [x] Landing page loads
- [x] Can sign up/sign in
- [x] Onboarding works
- [x] Dashboard shows
- [x] Product created
- [x] POS processes sale

---

## 🎉 Congratulations!

SwiftPOS is now running! Next steps:

### Explore Features
- Add more products
- Try offline mode (disconnect wifi)
- Check sales reports
- View audit logs
- Test different roles

### Customize
- Update colors in `src/app/globals.css`
- Change business name
- Add your logo

### Deploy
- Follow `DEPLOYMENT.md` for production
- Deploy to Vercel (free tier)
- Connect custom domain

---

## 🐛 Troubleshooting

### "Unauthorized" Error
**Fix:** Check Clerk keys in `.env.local`

### "Database Error"
**Fix:** Verify migrations ran successfully in Supabase

### Products Not Loading
**Fix:** Refresh page, check browser console

### Can't Create Sale
**Fix:** Ensure store is selected in POS

### Build Errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📚 Next Reading

- **Features:** See `FEATURES_CHECKLIST.md` for all capabilities
- **Architecture:** See `ARCHITECTURE.md` for system design
- **Deployment:** See `DEPLOYMENT.md` for going live
- **Setup Details:** See `SETUP_GUIDE.md` for deep dive

---

## 💡 Quick Tips

### Keyboard Shortcuts
- Search products: Just start typing in POS
- Quick checkout: Enter on barcode field

### Best Practices
- Add barcodes to products for faster scanning
- Use categories to organize products
- Check audit logs regularly
- Set up low stock alerts

### Performance
- Images load faster with URLs
- Use store selection in POS
- Clear browser cache if slow

---

## 🎯 Common Tasks

### Add Another Store
1. Dashboard → Stores
2. Click "Add Store"
3. Enter name & location

### Invite Team Member
1. Dashboard → Users
2. Click "Invite User"
3. Enter email & role
4. (Requires Clerk webhook setup)

### View Reports
1. Dashboard → Sales
2. See charts & statistics
3. Filter by date/store

### Change Subscription
1. Dashboard → Billing
2. Select new tier
3. (Requires Polar integration)

---

## 📞 Need Help?

### Documentation
- `README.md` - Overview
- `SETUP_GUIDE.md` - Detailed setup
- `DEPLOYMENT.md` - Production deployment
- `ARCHITECTURE.md` - Technical details

### Check Logs
- Browser Console (F12)
- Supabase Logs (Dashboard → Logs)
- Vercel Logs (if deployed)

### Common Resources
- Clerk Docs: https://clerk.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

## ⚡ Development Tips

### Hot Reload
Changes auto-refresh. No need to restart server!

### TypeScript
IDE shows type errors. Fix them before running!

### Database Changes
Run new migrations in Supabase SQL Editor

### Testing
Test in incognito mode for fresh session

---

## 🚀 Ready to Scale?

When you're ready for production:

1. **Get Production Keys**
   - Clerk: Switch to production keys
   - Supabase: Use production project

2. **Deploy**
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy!

3. **Monitor**
   - Set up error tracking
   - Enable analytics
   - Configure alerts

---

## 🎊 You're All Set!

SwiftPOS is ready to use. Start processing sales! 💰

**Time taken:** ~15 minutes ⚡
**Status:** Running ✅
**Next:** Explore and customize! 🎨

---

**Questions?** Check the documentation in this repository.

**Ready to deploy?** See `DEPLOYMENT.md`

**Want to customize?** See `ARCHITECTURE.md`

Happy selling! 🛍️

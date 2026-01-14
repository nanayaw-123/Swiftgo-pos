# 🚀 Supabase Setup Guide for SwiftPOS

## ✅ Prerequisites Completed
- [x] Supabase project created
- [x] Environment variables configured in `.env`
- [x] Service role key added

## 📋 Current Status

Your Supabase connection is configured and working! The test endpoint confirmed:
- ✅ Supabase URL is valid
- ✅ Service role key is working
- ⚠️ Database tables need to be created

## 🗄️ Step 1: Run Database Migrations

You have two options to set up your database tables:

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/andwiiymdgsjaeikkbpi
   - Click on "SQL Editor" in the left sidebar

2. **Run the Main Migration File**
   - Copy the entire contents of `supabase/migrations/20250101000000_init_swiftpos_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" button
   - Wait for confirmation message

3. **Verify Tables Created**
   - Click on "Table Editor" in the left sidebar
   - You should see all these tables:
     - `tenants`
     - `profiles`
     - `stores`
     - `products`
     - `product_expiry`
     - `low_stock_alerts`
     - `sales`
     - `inventory_movements`
     - `staff_performance`
     - `ai_insights`
     - `audit_logs`
     - `billing_subscriptions`
     - `feature_flags`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref andwiiymdgsjaeikkbpi

# Run migrations
supabase db push
```

## 🧪 Step 2: Test Your Database Connection

After running migrations, test the connection:

1. **Using the Test API Endpoint**
   - Visit: http://localhost:3000/api/test-supabase
   - You should see a success message with:
     ```json
     {
       "success": true,
       "message": "Supabase connection successful! ✅",
       "connection_status": "Connected",
       "tables_accessible": true
     }
     ```

## 🔐 Step 3: Understanding Row Level Security (RLS)

All tables have RLS enabled for security. This means:

- **Tenants Table**: Users can only see their own tenant
- **Profiles Table**: Users can view profiles in their tenant
- **Products/Sales/etc**: All data is scoped to the user's tenant
- **Service Role Key**: Bypasses RLS (used for webhooks and admin operations)

## 📊 Database Schema Overview

```
SwiftPOS Database Structure:
├── tenants (Company/Business)
│   ├── profiles (Staff members with roles)
│   ├── stores (Physical locations)
│   ├── products (Inventory items)
│   │   ├── product_expiry (Expiry tracking)
│   │   └── low_stock_alerts (Stock alerts)
│   ├── sales (Transactions)
│   ├── inventory_movements (Stock changes)
│   ├── staff_performance (Performance metrics)
│   ├── ai_insights (AI recommendations)
│   ├── audit_logs (Activity tracking)
│   ├── billing_subscriptions (Payments)
│   └── feature_flags (Feature toggles)
```

## 🎯 Step 4: Create Your First Tenant

Once migrations are done, you can create a tenant through the onboarding flow:

1. Sign up at: http://localhost:3000/sign-up
2. Complete the Clerk authentication
3. Go to onboarding: http://localhost:3000/onboarding
4. Fill in your business details:
   - Business name
   - Store location
   - Currency preference

This will automatically create:
- A new tenant record
- Your profile with 'owner' role
- Your first store

## 🔧 Troubleshooting

### Migration Errors

If you see errors like "relation already exists":
1. Go to Supabase Dashboard → Database → Tables
2. Check if tables exist
3. If they do, you're all set!
4. If not, try running individual migration files in order

### RLS Policy Errors

If you get permission errors:
1. Make sure you're using the service role key for admin operations
2. For user operations, use the client with JWT token from Clerk
3. Check if the `auth.clerk_user_id()` function exists in your database

### Connection Errors

If test endpoint fails:
1. Verify `.env` variables are correct
2. Check Supabase project is not paused
3. Verify service role key is the correct one
4. Restart dev server: `bun run dev`

## 📝 Next Steps

After database setup is complete:

1. **Test the Onboarding Flow**
   - Sign up → Onboarding → Dashboard
   - Verify tenant and profile are created

2. **Add Sample Products**
   - Go to Dashboard → Products
   - Add test products manually or via CSV import

3. **Test POS System**
   - Go to POS Terminal
   - Add products to cart
   - Complete a test transaction

4. **Check Analytics**
   - Go to Dashboard → Analytics
   - View sales reports and insights

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/andwiiymdgsjaeikkbpi
- **API Documentation**: https://supabase.com/docs/reference/javascript/introduction
- **RLS Documentation**: https://supabase.com/docs/guides/auth/row-level-security

## 💡 Pro Tips

1. **Use Service Role Key Sparingly**
   - Only for webhooks and admin operations
   - Never expose it to the client side

2. **Test RLS Policies**
   - Use the test endpoint to verify access control
   - Create multiple users to test permissions

3. **Monitor Usage**
   - Check Supabase dashboard for database size
   - Monitor API requests and errors

4. **Backup Your Data**
   - Supabase provides automatic backups
   - Export important data regularly

## ✅ Checklist

- [ ] Run database migrations
- [ ] Test connection with `/api/test-supabase`
- [ ] Create first tenant via onboarding
- [ ] Add sample products
- [ ] Complete test POS transaction
- [ ] Verify data in Supabase dashboard

---

**Need Help?** Check the Supabase documentation or open an issue in the project repository.

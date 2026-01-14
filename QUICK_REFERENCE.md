# 🚀 SwiftPOS - Quick Reference Guide (Post-Migration)

**Last Updated**: December 2, 2025  
**Stack**: Next.js 15 + Clerk + Supabase

---

## 🔐 Authentication (Clerk)

### Get Current User (Client-Side)
```typescript
import { useUser, useAuth } from '@clerk/nextjs'

function MyComponent() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  
  if (!isLoaded) return <Loading />
  if (!user) return <SignIn />
  
  return <div>Hello {user.firstName}</div>
}
```

### Get Current User (Server-Side API)
```typescript
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Continue with logic
}
```

### Protect Routes (Middleware)
Already configured in `src/middleware.ts`:
```typescript
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/pos(.*)',
  '/api/products(.*)',
  // ... etc
])
```

---

## 🗄️ Database (Supabase)

### Query Data (Server-Side)
```typescript
import { getServerSupabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  const supabase = getServerSupabase()
  
  // Get user's tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('clerk_id', userId)
    .single()
  
  // Get tenant's products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
  
  return Response.json(products)
}
```

### Query Data (Client-Side)
```typescript
import { supabase } from '@/lib/supabase'

async function fetchData() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
  
  if (error) console.error(error)
  return data
}
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    tenant_id: tenantId,
    name: 'Product Name',
    sku: 'SKU123',
    price: 99.99,
    stock: 100
  })
  .select()
  .single()
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('products')
  .update({ stock: 50 })
  .eq('id', productId)
  .eq('tenant_id', tenantId)
  .select()
```

### Delete Data
```typescript
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId)
  .eq('tenant_id', tenantId)
```

---

## 🎣 Custom Hooks

### Get User Role & Tenant
```typescript
import { useUserRole } from '@/hooks/useUserRole'

function Dashboard() {
  const { role, tenantId, isLoading } = useUserRole()
  
  if (isLoading) return <Loading />
  
  if (role === 'owner') {
    return <OwnerDashboard />
  } else if (role === 'manager') {
    return <ManagerDashboard />
  } else {
    return <CashierDashboard />
  }
}
```

---

## 📝 Database Schema Reference

### Tables:
- `tenants` - Organizations
- `profiles` - Users (linked to Clerk)
- `stores` - Store locations
- `products` - Product catalog
- `sales` - Transactions
- `inventory_movements` - Stock changes
- `low_stock_alerts` - Inventory alerts
- `product_expiry` - Expiry tracking
- `staff_performance` - Performance metrics
- `ai_insights` - AI recommendations
- `audit_logs` - Activity logs
- `billing_subscriptions` - Subscription status
- `feature_flags` - Feature toggles

### Key Relationships:
```
tenants (1) ←→ (many) profiles
tenants (1) ←→ (many) stores
tenants (1) ←→ (many) products
products (1) ←→ (many) sales
stores (1) ←→ (many) sales
```

---

## 🔒 Row Level Security (RLS)

All tables automatically filter by tenant. Example:

```sql
-- User can only see products in their tenant
SELECT * FROM products WHERE tenant_id IN (
  SELECT tenant_id FROM profiles WHERE clerk_id = auth.clerk_user_id()
)
```

You **don't need to add WHERE clauses** for tenant_id - RLS handles it automatically!

---

## 🛠️ Common Patterns

### API Route Template
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getServerSupabase } from '@/lib/supabase'

async function getTenantId(userId: string) {
  const supabase = getServerSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('clerk_id', userId)
    .single()
  return data?.tenant_id || null
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = await getTenantId(userId)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 200 })
}
```

### Component with Auth
```typescript
'use client'

import { useUser } from '@clerk/nextjs'
import { useUserRole } from '@/hooks/useUserRole'

export default function MyPage() {
  const { user, isLoaded } = useUser()
  const { role, tenantId, isLoading } = useUserRole()

  if (!isLoaded || isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>Welcome {user.firstName}</h1>
      <p>Role: {role}</p>
      <p>Tenant: {tenantId}</p>
    </div>
  )
}
```

---

## 🌐 Environment Variables

Required in `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🧪 Testing APIs

### Using curl (without auth)
```bash
curl http://localhost:3000/api/profile
```

### Using curl (with Clerk auth)
```bash
# Get token from browser DevTools: localStorage.getItem('__clerk_client_jwt')
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:3000/api/products
```

---

## 📍 Key File Locations

| Purpose | File Path |
|---------|-----------|
| Auth Config | `src/middleware.ts` |
| Supabase Utils | `src/lib/supabase.ts` |
| Custom Hooks | `src/hooks/useUserRole.ts` |
| Database Schema | `supabase/migrations/20250101000000_init_swiftpos_schema.sql` |
| Navigation | `src/components/Navigation.tsx` |
| Layout (Clerk) | `src/app/layout.tsx` |

---

## 🚨 Common Issues

### "User not found in profiles table"
**Solution**: User needs to complete onboarding at `/onboarding`

### "SUPABASE_SERVICE_ROLE_KEY is not set"
**Solution**: Add service role key from Supabase Dashboard → Settings → API

### "Clerk middleware error"
**Solution**: Ensure `src/middleware.ts` exists (not `middleware.ts` in root)

### "RLS policy blocking query"
**Solution**: Ensure Clerk JWT template is configured for Supabase

---

## 📚 Documentation

- **Clerk**: https://clerk.com/docs
- **Supabase**: https://supabase.com/docs
- **Next.js 15**: https://nextjs.org/docs

---

## 🎯 Quick Commands

```bash
# Start development server
bun dev

# Build for production
bun run build

# Run production build
bun start

# Install new package
bun add package-name

# Remove package
bun remove package-name
```

---

## ✅ Pre-Deployment Checklist

- [ ] Supabase migration run in production
- [ ] Clerk JWT template configured
- [ ] Environment variables set in hosting platform
- [ ] Clerk webhook configured
- [ ] Test sign-up flow
- [ ] Test onboarding flow
- [ ] Test dashboard access
- [ ] Test POS functionality

---

**Questions?** Check `FINAL_MIGRATION_SUMMARY.md` for comprehensive details.

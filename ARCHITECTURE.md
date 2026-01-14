# SwiftPOS Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Landing Pages│  │   Auth Pages │  │   Dashboard   │     │
│  │  - Home      │  │  - Sign In   │  │  - Products   │     │
│  │  - Pricing   │  │  - Sign Up   │  │  - Sales      │     │
│  │  - Features  │  │  - Onboarding│  │  - POS        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          IndexedDB (Dexie)                           │  │
│  │  - Cached Products                                   │  │
│  │  - Offline Sales Queue                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS 15 SERVER (Vercel/Node)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                        │  │
│  │  - Clerk Auth Check                                  │  │
│  │  - Route Protection                                  │  │
│  │  - Session Validation                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes                              │  │
│  │  POST /api/onboarding      - Tenant setup           │  │
│  │  POST /api/pos/checkout    - Process sales          │  │
│  │  POST /api/products        - Create products        │  │
│  │  POST /api/stores          - Create stores          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Server Components                       │  │
│  │  - Landing pages (Static)                           │  │
│  │  - Dashboard layouts                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Client Components                       │  │
│  │  - Interactive UI (use client)                      │  │
│  │  - Forms & Modals                                    │  │
│  │  - POS Terminal                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │                   │
        ┌───────────┘                   └───────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                    ┌──────────────────┐
│   CLERK AUTH     │                    │    SUPABASE      │
├──────────────────┤                    ├──────────────────┤
│ - User Sessions  │                    │  PostgreSQL DB   │
│ - Authentication │                    │  - tenants       │
│ - User Profile   │                    │  - profiles      │
│ - Webhooks       │                    │  - products      │
│                  │                    │  - sales         │
│                  │                    │  - stores        │
│                  │                    │  - audit_logs    │
│                  │                    │                  │
│                  │                    │  Realtime        │
│                  │                    │  - Subscriptions │
│                  │                    │  - Live Updates  │
│                  │                    │                  │
│                  │                    │  Row Level       │
│                  │                    │  Security (RLS)  │
│                  │                    │  - Tenant Scope  │
│                  │                    │  - Role Perms    │
└──────────────────┘                    └──────────────────┘
```

## Data Flow Diagrams

### User Authentication Flow

```
User → Clerk Sign Up → Create Account
                          │
                          ▼
                    Redirect to /onboarding
                          │
                          ▼
                    Fill Business Info
                          │
                          ▼
              POST /api/onboarding
                          │
                          ├─→ Create Tenant in Supabase
                          ├─→ Create Profile (Owner)
                          ├─→ Create First Store
                          │
                          ▼
                    Redirect to /dashboard
```

### POS Sale Processing Flow

```
Cashier → Select Products → Add to Cart (Zustand)
                               │
                               ▼
                         Select Payment Method
                               │
                               ▼
                         Check Internet Status
                               │
                ┌──────────────┴──────────────┐
                │                             │
            Online                        Offline
                │                             │
                ▼                             ▼
    POST /api/pos/checkout          Store in IndexedDB
                │                             │
                ├─→ Create Sale Record        │
                ├─→ Update Stock              │
                ├─→ Create Inventory Mvmt     │
                ├─→ Create Audit Log          │
                │                             │
                ▼                             ▼
        Success Response              Mark as Unsynced
                │                             │
                └─────────────┬───────────────┘
                              │
                              ▼
                      Clear Cart & Show Receipt
                              │
                              ▼
                    (When online: Auto-sync queued sales)
```

### Real-time Update Flow

```
User A makes change → API Route → Supabase Insert/Update
                                         │
                                         ▼
                            Supabase Realtime Broadcast
                                         │
                        ┌────────────────┼────────────────┐
                        │                │                │
                        ▼                ▼                ▼
                    User A           User B           User C
                    (Updated)      (Receives)       (Receives)
```

### Multi-tenant Data Isolation

```
HTTP Request → Middleware → Extract Clerk User ID
                                   │
                                   ▼
                          Query Supabase
                                   │
                                   ▼
                    get_user_tenant_id(clerk_id)
                                   │
                                   ▼
                            Return tenant_id
                                   │
                                   ▼
                    RLS Policies Filter Data
                                   │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            Tenant A Data                   Tenant B Data
            (Isolated)                      (Isolated)
```

## Component Architecture

### Page Components Structure

```
src/app/
├── (marketing)/
│   ├── page.tsx              → Landing (Server)
│   ├── pricing/              → Pricing (Server)
│   └── features/             → Features (Server)
│
├── (auth)/
│   ├── sign-in/              → Clerk Sign In
│   ├── sign-up/              → Clerk Sign Up
│   └── onboarding/           → Tenant Setup (Client)
│
├── dashboard/
│   ├── page.tsx              → Dashboard Home (Client)
│   ├── products/             → Products CRUD (Client)
│   ├── sales/                → Sales Reports (Client)
│   ├── stores/               → Stores CRUD (Client)
│   ├── users/                → Team Management (Client)
│   ├── billing/              → Subscriptions (Client)
│   ├── audit-logs/           → Activity Logs (Client)
│   └── settings/             → Settings (Client)
│
└── pos/
    └── page.tsx              → POS Terminal (Client)
```

### Shared Components

```
src/components/
├── ui/                       → Shadcn UI Components (44+)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
│
├── Navigation.tsx            → Main navbar (Client)
├── Footer.tsx                → Footer (Server)
└── DashboardLayout.tsx       → Dashboard wrapper (Client)
```

### State Management

```
Zustand Stores:
├── pos-store.ts              → Cart management
│   ├── cart: CartItem[]
│   ├── addToCart()
│   ├── removeFromCart()
│   ├── updateQuantity()
│   └── getTotal()
│
└── (Future stores as needed)
```

## Database Schema

### Entity Relationship

```
tenants (1) ──┬─→ (N) profiles
              │
              ├─→ (N) stores
              │
              ├─→ (N) products
              │
              ├─→ (N) sales
              │      │
              │      └─→ stores (FK)
              │
              ├─→ (N) inventory_movements
              │      │
              │      ├─→ products (FK)
              │      └─→ stores (FK)
              │
              ├─→ (N) billing_subscriptions
              │
              ├─→ (N) feature_flags
              │
              └─→ (N) audit_logs
```

### RLS Policy Flow

```
Query → RLS Check → auth.jwt() → Extract user_id
                                      │
                                      ▼
                          get_user_tenant_id(user_id)
                                      │
                                      ▼
                              Return tenant_id
                                      │
                                      ▼
                    Filter: WHERE tenant_id = user_tenant
                                      │
                                      ▼
                              Return filtered data
```

## Security Layers

### Defense in Depth

```
Layer 1: Clerk Authentication
    │
    ├─→ Session validation
    ├─→ Token verification
    └─→ User identity
        │
        ▼
Layer 2: Next.js Middleware
    │
    ├─→ Route protection
    ├─→ Request validation
    └─→ Redirect unauthenticated
        │
        ▼
Layer 3: API Route Authorization
    │
    ├─→ User ID verification
    ├─→ Tenant lookup
    └─→ Permission check
        │
        ▼
Layer 4: Database RLS
    │
    ├─→ Row-level filtering
    ├─→ Tenant isolation
    └─→ Role-based access
        │
        ▼
    Data Access Granted
```

## Deployment Architecture

### Production Stack (Vercel + Supabase)

```
┌─────────────────────────────────────────┐
│           Vercel Edge Network           │
│  ┌──────────────────────────────────┐  │
│  │     Next.js Application          │  │
│  │  - Server Components             │  │
│  │  - API Routes                    │  │
│  │  - Static Assets                 │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Supabase Cloud                  │
│  ┌──────────────────────────────────┐  │
│  │     PostgreSQL Database          │  │
│  │  - Primary instance              │  │
│  │  - Automatic backups             │  │
│  │  - Connection pooling            │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │     Realtime Server              │  │
│  │  - WebSocket connections         │  │
│  │  - Change notifications          │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │     Storage (Future)             │  │
│  │  - Product images                │  │
│  │  - Receipts                      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Technology Stack Details

### Frontend Stack
- **Framework:** Next.js 15.1
- **React:** 19.x
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 4.x
- **Components:** Shadcn UI (Radix UI primitives)
- **State:** Zustand 5.x
- **Forms:** React Hook Form
- **Date:** date-fns 4.x
- **Charts:** Recharts 3.x
- **Icons:** Lucide React
- **Toast:** Sonner

### Backend Stack
- **Runtime:** Node.js (Vercel)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Clerk
- **Realtime:** Supabase Realtime
- **Storage:** IndexedDB (Dexie)

### Development Tools
- **Package Manager:** npm/bun
- **Linter:** ESLint
- **Formatter:** Prettier (implicit)
- **Type Checking:** TypeScript

## Performance Optimizations

### Client-Side
- Server Components by default
- Dynamic imports for heavy components
- Image optimization (Next.js Image)
- IndexedDB caching
- Optimistic UI updates

### Server-Side
- Static page generation
- API route optimization
- Database query optimization
- Connection pooling
- Proper indexing

### Network
- CDN delivery (Vercel Edge)
- HTTP/2
- Compression
- Caching headers

## Monitoring & Observability (Ready)

### Logs
- Supabase logs
- Vercel logs
- Clerk logs
- Custom audit logs

### Metrics (To Add)
- Page load times
- API response times
- Error rates
- User engagement

### Alerts (To Add)
- Error thresholds
- Performance degradation
- Security events
- Billing alerts

---

This architecture is designed for:
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Maintainability
- ✅ Real-time capabilities
- ✅ Offline resilience

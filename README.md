# SwiftPOS - Modern SaaS Point of Sale System

A complete, production-ready POS system built with Next.js 15, TypeScript, Supabase, and Clerk.

## 🚀 Features

### Core Features
- **Multi-tenant SaaS Architecture** - Each business has isolated data
- **Real-time Inventory Management** - Live updates across all devices
- **Offline-First POS** - Continue selling without internet using IndexedDB
- **Role-Based Access Control** - Owner, Manager, and Cashier roles
- **Barcode Scanner Support** - Fast product lookup
- **Multiple Payment Methods** - Cash, Card, and Digital payments
- **Advanced Analytics** - Sales reports with charts and insights
- **Multi-location Support** - Manage multiple stores
- **Audit Logging** - Complete activity trail
- **Subscription Management** - Tiered pricing with Polar integration

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn UI
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime
- **Offline Storage:** Dexie (IndexedDB)
- **State Management:** Zustand
- **Charts:** Recharts
- **Payments:** Polar (ready for integration)

## 📁 Project Structure

```
swiftpos/
├── src/
│   ├── app/
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── products/       # Product management
│   │   │   ├── sales/          # Sales reports
│   │   │   ├── stores/         # Store management
│   │   │   ├── users/          # Team management
│   │   │   ├── billing/        # Subscription management
│   │   │   ├── audit-logs/     # Activity logs
│   │   │   └── settings/       # Settings
│   │   ├── pos/                # POS Terminal
│   │   ├── sign-in/            # Authentication
│   │   ├── sign-up/            # Registration
│   │   ├── onboarding/         # Tenant setup
│   │   ├── pricing/            # Pricing page
│   │   ├── features/           # Features page
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Shadcn UI components
│   │   ├── Navigation.tsx      # Main navigation
│   │   ├── Footer.tsx          # Footer
│   │   └── DashboardLayout.tsx # Dashboard layout
│   └── lib/
│       ├── supabase.ts         # Supabase client
│       ├── clerk.ts            # Clerk helpers
│       ├── tenant.ts           # Tenant helpers
│       ├── db.ts               # IndexedDB setup
│       └── pos-store.ts        # POS state management
├── supabase/
│   └── migrations/             # Database migrations
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_stock_functions.sql
├── middleware.ts               # Auth middleware
└── .env.local.example          # Environment variables template
```

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Polar (Optional - for payments)
POLAR_API_KEY=your_polar_api_key
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=your_polar_organization_id
```

### 3. Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Copy your API keys to `.env.local`
3. Configure redirect URLs in Clerk dashboard

### 4. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run the migrations in order in the Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_stock_functions.sql`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📊 Database Schema

### Tables

- **tenants** - Multi-tenant organizations
- **profiles** - User profiles with roles
- **stores** - Physical store locations
- **products** - Product catalog with inventory
- **sales** - Sales transactions
- **inventory_movements** - Inventory tracking
- **billing_subscriptions** - Subscription management
- **feature_flags** - Feature toggles
- **audit_logs** - Activity audit trail

### Row Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only access data from their tenant
- Role-based permissions are enforced
- Owners have full access
- Managers can manage products, inventory, and users
- Cashiers can create sales and view products

## 🎯 Key Features Implementation

### Offline Mode
The POS terminal uses IndexedDB (via Dexie) to:
- Cache products locally
- Store sales offline
- Automatically sync when connection is restored

### Real-time Updates
Supabase Realtime is used for:
- Live inventory updates
- New sales notifications
- Audit log streaming

### Role-Based Access
Three roles with different permissions:
- **Owner:** Full access to all features
- **Manager:** Can manage products, inventory, and team
- **Cashier:** Can process sales and view products

### Multi-tenant Architecture
Each business (tenant) has:
- Isolated data in the database
- Own subscription tier
- Independent user management
- Separate stores and inventory

## 🔐 Security

- Row Level Security (RLS) on all tables
- Clerk authentication with middleware protection
- Audit logging for compliance
- Environment variable protection
- HTTPS-only in production

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## 📱 Usage

### For Business Owners

1. **Sign Up** - Create an account
2. **Onboarding** - Set up your business and first store
3. **Add Products** - Create your product catalog
4. **Invite Team** - Add managers and cashiers
5. **Start Selling** - Use the POS terminal

### For Cashiers

1. **Sign In** - Use your credentials
2. **Select Store** - Choose your location
3. **Scan Products** - Use barcode scanner or search
4. **Process Payment** - Accept cash, card, or digital
5. **Complete Sale** - Generate receipt

## 📝 API Routes

- `POST /api/onboarding` - Create tenant and initial setup
- `POST /api/pos/checkout` - Process sale
- `POST /api/products` - Create product
- `POST /api/stores` - Create store

---

Built with ❤️ using Next.js, Supabase, and Clerk

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

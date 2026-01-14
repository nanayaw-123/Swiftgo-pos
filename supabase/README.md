# SwiftPOS Database Setup

## Running Migrations

To set up the database, run the migrations in order in your Supabase SQL editor:

1. `001_initial_schema.sql` - Creates all tables and indexes
2. `002_rls_policies.sql` - Sets up Row Level Security policies

## Tables

- **tenants** - Multi-tenant businesses
- **profiles** - User profiles with roles (owner/manager/cashier)
- **stores** - Physical store locations
- **products** - Product catalog with inventory
- **sales** - Sales transactions
- **inventory_movements** - Inventory tracking
- **billing_subscriptions** - Subscription management
- **feature_flags** - Feature toggles per tenant
- **audit_logs** - Audit trail for compliance

## Security

All tables have Row Level Security (RLS) enabled. Users can only access data within their tenant.

## Authentication

The system uses Clerk for authentication. The Clerk user ID is stored in the `clerk_id` field and linked to the appropriate tenant through the `profiles` table.

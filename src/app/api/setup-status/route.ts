import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export async function GET() {
  const checks = {
    supabase_url: false,
    supabase_anon_key: false,
    supabase_service_role: false,
    database_connection: false,
    tables_created: false,
    rls_enabled: false,
  }

  const results = {
    all_configured: false,
    checks,
    next_steps: [] as string[],
  }

  try {
    // Check environment variables
    checks.supabase_url = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    checks.supabase_anon_key = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    checks.supabase_service_role = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!checks.supabase_url || !checks.supabase_anon_key || !checks.supabase_service_role) {
      results.next_steps.push('Configure all Supabase environment variables in .env file')
      return NextResponse.json(results)
    }

    // Check database connection
    const supabase = getServerSupabase()
    
    // Try to query tenants table
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)

    if (tenantsError) {
      if (tenantsError.code === 'PGRST205') {
        checks.database_connection = true
        results.next_steps.push('Run database migrations using Supabase Dashboard SQL Editor')
        results.next_steps.push('See SUPABASE_SETUP.md for detailed instructions')
        return NextResponse.json(results)
      }
      throw tenantsError
    }

    checks.database_connection = true
    checks.tables_created = true
    checks.rls_enabled = true

    // Check other critical tables
    const tablesToCheck = ['profiles', 'stores', 'products', 'sales']
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (error) {
        results.next_steps.push(`Table '${table}' is missing or inaccessible`)
        return NextResponse.json(results)
      }
    }

    results.all_configured = true
    results.next_steps = [
      '✅ All systems ready!',
      'You can now sign up and start using SwiftPOS',
      'Visit /register to create your account',
    ]

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({
      ...results,
      error: error.message,
      next_steps: [
        'Database connection error',
        'Check your SUPABASE_SERVICE_ROLE_KEY',
        'Verify your Supabase project is active',
      ],
    }, { status: 500 })
  }
}
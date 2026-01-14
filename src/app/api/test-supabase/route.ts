import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test database connection
    const supabase = getServerSupabase()
    
    // Try to query the tenants table to verify connection
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: error.message,
        details: error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful! ✅',
      connection_status: 'Connected',
      database_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tables_accessible: true,
      sample_query_executed: true,
      tenants_count: data?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

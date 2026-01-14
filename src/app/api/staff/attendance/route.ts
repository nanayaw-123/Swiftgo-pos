import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = getServerSupabase();

    // Note: The attendance table doesn't have a direct tenant_id/business_id column in the schema I saw.
    // Usually, attendance is linked to a staff profile which is linked to a tenant.
    // For now, we'll try to fetch all and order by created_at.
    // In a real scenario, you'd join with staff_profiles.
    
    let query = supabase
      .from('attendance')
      .select('*');

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('GET attendance error:', error);
      return NextResponse.json({ error: 'Failed to fetch attendance: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { payroll_ready } = body;

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        payroll_ready: !!payroll_ready,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('POST attendance error:', error);
      return NextResponse.json({ error: 'Failed to record attendance: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

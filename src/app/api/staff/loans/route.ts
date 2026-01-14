import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser, getServerSupabase } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const supabase = await getServerSupabase();
    
    // Join with profiles to filter by tenant_id
    const { data, error } = await supabase
      .from('staff_loans')
      .select('*, profiles!inner(*)')
      .eq('profiles.tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { staff_id, amount } = body;

    const supabase = await getServerSupabase();

    // Verify staff belongs to tenant
    const { data: staff, error: staffError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', staff_id)
      .eq('tenant_id', tenantId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('staff_loans')
      .insert({
        staff_id,
        amount,
        balance: amount
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

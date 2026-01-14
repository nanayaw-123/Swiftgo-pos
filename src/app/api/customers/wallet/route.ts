import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser, getServerSupabase } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const supabase = await getServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customer_id');

    if (customerId) {
      // Get wallet for specific customer
      const { data, error } = await supabase
        .from('customer_wallet')
        .select('*, customers!inner(*)')
        .eq('customer_id', customerId)
        .eq('customers.tenant_id', tenantId)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Get all wallets for tenant
    const { data, error } = await supabase
      .from('customer_wallet')
      .select('*, customers!inner(*)')
      .eq('customers.tenant_id', tenantId);

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
    const { customer_id, balance } = body;

    const supabase = await getServerSupabase();

    // Verify customer belongs to tenant
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('tenant_id', tenantId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('customer_wallet')
      .upsert({
        customer_id,
        balance
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

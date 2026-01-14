import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser, getServerSupabase } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const supabase = await getServerSupabase();
    
    // Filter by joining with sales
    const { data, error } = await supabase
      .from('receipts')
      .select('*, sales!inner(*)')
      .eq('sales.tenant_id', tenantId)
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
    const { sale_id, receipt_number } = body;

    const supabase = await getServerSupabase();

    // Verify sale belongs to tenant
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id')
      .eq('id', sale_id)
      .eq('tenant_id', tenantId)
      .single();

    if (saleError || !sale) {
      return NextResponse.json({ error: 'Sale not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        sale_id,
        receipt_number,
        printed: false
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

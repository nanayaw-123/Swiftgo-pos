import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';

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

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const supabase = getServerSupabase();

    // Fetch individual performance records
    let query = supabase
      .from('staff_performance')
      .select('*')
      .eq('tenant_id', tenantId);

    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data: records, error } = await query
      .order('sales_total', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map records to match the dashboard's expected interface
    const performanceRecords = (records || []).map(r => ({
      staff_id: r.staff_id,
      staff_role: 'staff', // This should ideally be joined from profiles, but defaulting for now
      date: r.date,
      total_sales: parseFloat(r.sales_total.toString()),
      transactions_count: r.sales_count,
      items_sold: r.items_sold || 0,
      average_transaction_value: parseFloat(r.average_transaction_value?.toString() || '0')
    }));

    // Calculate summary
    const summary = {
      total_sales: performanceRecords.reduce((sum, r) => sum + r.total_sales, 0),
      total_transactions: performanceRecords.reduce((sum, r) => sum + r.transactions_count, 0),
      total_items_sold: performanceRecords.reduce((sum, r) => sum + r.items_sold, 0),
      average_per_staff: performanceRecords.length > 0 
        ? performanceRecords.reduce((sum, r) => sum + r.total_sales, 0) / performanceRecords.length 
        : 0
    };

    return NextResponse.json({
      performance_records: performanceRecords,
      summary
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

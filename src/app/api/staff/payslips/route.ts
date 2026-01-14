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
    const payrollId = searchParams.get('payroll_id');
    const staffId = searchParams.get('staff_id');

    let query = supabase.from('payslips').select('*, Staff_profiles(full_name)');
    if (payrollId) query = query.eq('payroll_id', payrollId);
    if (staffId) query = query.eq('staff_id', staffId);

    const { data, error } = await query;

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

    const body = await request.json();
    const { payroll_id, staff_id, gross_salary, deductions, net_salary } = body;

    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('payslips').insert({
      payroll_id,
      staff_id,
      gross_salary,
      deductions,
      net_salary
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

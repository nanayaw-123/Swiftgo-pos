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
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = getServerSupabase();

    let query = supabase
      .from('Expenses')
      .select('*')
      .eq('business_id', tenantId);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('GET expenses error:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses: ' + error.message }, { status: 500 });
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

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, amount, category, branch_id } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: 'Title and amount are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('Expenses')
      .insert({
        business_id: tenantId,
        branch_id: branch_id || null,
        title,
        amount: parseFloat(amount),
        category: category || 'General',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('POST expense error:', error);
      return NextResponse.json({ error: 'Failed to create expense: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

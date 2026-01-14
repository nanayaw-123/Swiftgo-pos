import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser, getServerSupabase } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const supabase = await getServerSupabase();
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('business_id', tenantId)
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
    const { key, is_active } = body;

    const supabase = await getServerSupabase();

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        business_id: tenantId,
        key: key || crypto.randomUUID(),
        is_active: is_active ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

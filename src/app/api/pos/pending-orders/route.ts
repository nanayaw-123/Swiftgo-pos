import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = getServerSupabase();

    const { data: orders, error } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { store_id, items, total, customer_name, notes } = body;

    if (!store_id || !items || !Array.isArray(items) || items.length === 0 || !total) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: order, error } = await supabase
      .from('pending_orders')
      .insert({
        tenant_id: tenantId,
        store_id,
        cashier_id: user.id,
        items,
        total: parseFloat(total),
        customer_name,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pending order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { error } = await supabase
      .from('pending_orders')
      .delete()
      .eq('id', orderId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting pending order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
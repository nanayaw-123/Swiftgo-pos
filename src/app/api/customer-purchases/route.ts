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

    const supabase = getServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const customerId = searchParams.get('customer_id');
    const saleId = searchParams.get('sale_id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record fetch by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('customer_purchases')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // List with filters
    let query = supabase
      .from('customer_purchases')
      .select('*')
      .eq('tenant_id', tenantId);

    // Filter by customer_id
    if (customerId) {
      if (isNaN(parseInt(customerId))) {
        return NextResponse.json({ 
          error: 'Valid customer_id is required',
          code: 'INVALID_CUSTOMER_ID' 
        }, { status: 400 });
      }
      query = query.eq('customer_id', parseInt(customerId));
    }

    // Filter by sale_id
    if (saleId) {
      query = query.eq('sale_id', saleId);
    }

    // Date range filtering
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('GET purchases error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch purchases: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(data || []);

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
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
    const { customer_id, sale_id, amount, loyalty_points_earned } = body;

    // Validation
    if (!customer_id) {
      return NextResponse.json({ 
        error: 'customer_id is required',
        code: 'MISSING_CUSTOMER_ID' 
      }, { status: 400 });
    }

    if (!sale_id) {
      return NextResponse.json({ 
        error: 'sale_id is required',
        code: 'MISSING_SALE_ID' 
      }, { status: 400 });
    }

    if (!amount) {
      return NextResponse.json({ 
        error: 'amount is required',
        code: 'MISSING_AMOUNT' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(customer_id))) {
      return NextResponse.json({ 
        error: 'Valid customer_id is required',
        code: 'INVALID_CUSTOMER_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Validate customer exists and belongs to same tenant
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, tenant_id')
      .eq('id', parseInt(customer_id))
      .eq('tenant_id', tenantId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ 
        error: 'Customer not found or does not belong to your tenant',
        code: 'INVALID_CUSTOMER' 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData = {
      tenant_id: tenantId,
      customer_id: parseInt(customer_id),
      sale_id: sale_id.trim(),
      amount: amount.toString(),
      loyalty_points_earned: loyalty_points_earned ? parseInt(loyalty_points_earned) : 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customer_purchases')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('POST purchase error:', error);
      return NextResponse.json({ 
        error: 'Failed to create purchase: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if purchase exists and belongs to tenant
    const { data: existingPurchase, error: checkError } = await supabase
      .from('customer_purchases')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existingPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Delete the purchase
    const { error: deleteError } = await supabase
      .from('customer_purchases')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('DELETE purchase error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete purchase: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Purchase deleted successfully',
      deleted: existingPurchase
    });

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

const VALID_SEGMENTS = ['vip', 'regular', 'at_risk', 'new'];

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
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const segment = searchParams.get('segment');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = getServerSupabase();

    // Single customer by ID
    if (id) {
      const customerId = parseInt(id);
      if (isNaN(customerId)) {
        return NextResponse.json({ error: 'Valid ID is required', code: 'INVALID_ID' }, { status: 400 });
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      return NextResponse.json(customer);
    }

    // List customers with filters
    let query = supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId);

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`
      );
    }

    // Segment filter
    if (segment) {
      if (!VALID_SEGMENTS.includes(segment)) {
        return NextResponse.json(
          { error: 'Invalid customer segment', code: 'INVALID_SEGMENT' },
          { status: 400 }
        );
      }
      query = query.eq('customer_segment', segment);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: customers, error } = await query;

    if (error) {
      console.error('GET customers error:', error);
      return NextResponse.json({ error: 'Failed to fetch customers: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(customers || []);
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
    const { first_name, last_name, email, phone, customer_segment, notes } = body;

    // Validate required fields
    if (!first_name || !first_name.trim()) {
      return NextResponse.json(
        { error: 'First name is required', code: 'MISSING_FIRST_NAME' },
        { status: 400 }
      );
    }

    if (!last_name || !last_name.trim()) {
      return NextResponse.json(
        { error: 'Last name is required', code: 'MISSING_LAST_NAME' },
        { status: 400 }
      );
    }

    // Validate customer segment if provided
    if (customer_segment && !VALID_SEGMENTS.includes(customer_segment)) {
      return NextResponse.json(
        { error: `Customer segment must be one of: ${VALID_SEGMENTS.join(', ')}`, code: 'INVALID_SEGMENT' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newCustomer = {
      tenant_id: tenantId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email ? email.trim().toLowerCase() : null,
      phone: phone ? phone.trim() : null,
      loyalty_points: 0,
      total_spent: '0',
      visit_count: 0,
      last_visit_at: null,
      customer_segment: customer_segment || null,
      notes: notes ? notes.trim() : null,
      created_at: now,
      updated_at: now,
    };

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single();

    if (error) {
      console.error('POST customer error:', error);
      return NextResponse.json({ error: 'Failed to create customer: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      id,
      first_name,
      last_name,
      email,
      phone,
      loyalty_points,
      total_spent,
      visit_count,
      last_visit_at,
      customer_segment,
      notes,
    } = body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required', code: 'INVALID_ID' }, { status: 400 });
    }

    const customerId = parseInt(id);
    const supabase = getServerSupabase();

    // Check if customer exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Validate customer segment if provided
    if (customer_segment && customer_segment !== null && !VALID_SEGMENTS.includes(customer_segment)) {
      return NextResponse.json(
        { error: `Customer segment must be one of: ${VALID_SEGMENTS.join(', ')}`, code: 'INVALID_SEGMENT' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (first_name !== undefined) updates.first_name = first_name.trim();
    if (last_name !== undefined) updates.last_name = last_name.trim();
    if (email !== undefined) updates.email = email ? email.trim().toLowerCase() : null;
    if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
    if (loyalty_points !== undefined) updates.loyalty_points = parseInt(loyalty_points);
    if (total_spent !== undefined) updates.total_spent = total_spent;
    if (visit_count !== undefined) updates.visit_count = parseInt(visit_count);
    if (last_visit_at !== undefined) updates.last_visit_at = last_visit_at;
    if (customer_segment !== undefined) updates.customer_segment = customer_segment;
    if (notes !== undefined) updates.notes = notes ? notes.trim() : null;

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PUT customer error:', error);
      return NextResponse.json({ error: 'Failed to update customer: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
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
      return NextResponse.json({ error: 'Valid ID is required', code: 'INVALID_ID' }, { status: 400 });
    }

    const customerId = parseInt(id);
    const supabase = getServerSupabase();

    // Check if customer exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('DELETE customer error:', error);
      return NextResponse.json({ error: 'Failed to delete customer: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Customer deleted successfully',
      deleted: existing,
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
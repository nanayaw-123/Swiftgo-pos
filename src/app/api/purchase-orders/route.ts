import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

// GET - List purchase orders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get tenant ID
    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const supabase = getServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    
    const id = searchParams.get('id');
    const supplierId = searchParams.get('supplier_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ 
          error: 'Purchase order not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // List query with filters
    let query = supabase
      .from('purchase_orders')
      .select('*')
      .eq('tenant_id', tenantId);

    // Apply filters
    if (supplierId) {
      query = query.eq('supplier_id', parseInt(supplierId));
    }

    if (status) {
      query = query.eq('status', status);
    }

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
      console.error('GET purchase_orders error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch purchase orders: ' + error.message 
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

// POST - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get tenant ID
    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      supplier_id, 
      items, 
      total_amount, 
      order_number,
      status = 'draft',
      expected_delivery_date,
      notes 
    } = body;

    // Validation
    if (!supplier_id) {
      return NextResponse.json({ 
        error: 'supplier_id is required',
        code: 'MISSING_SUPPLIER_ID' 
      }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'items must be a non-empty array',
        code: 'INVALID_ITEMS' 
      }, { status: 400 });
    }

    if (!total_amount) {
      return NextResponse.json({ 
        error: 'total_amount is required',
        code: 'MISSING_TOTAL_AMOUNT' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'received', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `status must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Validate supplier exists and belongs to tenant
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplier_id)
      .eq('tenant_id', tenantId)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ 
        error: 'Supplier not found or does not belong to your tenant',
        code: 'INVALID_SUPPLIER' 
      }, { status: 400 });
    }

    // Generate order number if not provided
    const finalOrderNumber = order_number || `PO-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Create purchase order
    const insertData = {
      tenant_id: tenantId,
      supplier_id,
      order_number: finalOrderNumber,
      status,
      items: JSON.stringify(items),
      total_amount: total_amount.toString(),
      expected_delivery_date: expected_delivery_date || null,
      received_date: null,
      created_by: user.id,
      notes: notes || null,
      created_at: timestamp,
      updated_at: timestamp
    };

    const { data: newOrder, error: insertError } = await supabase
      .from('purchase_orders')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('POST purchase_orders error:', insertError);
      
      // Handle unique constraint violation for order_number
      if (insertError.code === '23505') {
        return NextResponse.json({ 
          error: 'Purchase order number already exists',
          code: 'DUPLICATE_ORDER_NUMBER' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create purchase order: ' + insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json(newOrder, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

// PUT - Update existing purchase order
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get tenant ID
    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      id,
      supplier_id,
      order_number,
      status,
      items,
      total_amount,
      expected_delivery_date,
      received_date,
      notes
    } = body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existingOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ 
        error: 'Purchase order not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['draft', 'sent', 'received', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: `status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
    }

    // Validate supplier if provided
    if (supplier_id) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', supplier_id)
        .eq('tenant_id', tenantId)
        .single();

      if (supplierError || !supplier) {
        return NextResponse.json({ 
          error: 'Supplier not found or does not belong to your tenant',
          code: 'INVALID_SUPPLIER' 
        }, { status: 400 });
      }
    }

    // Validate items if provided
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ 
          error: 'items must be a non-empty array',
          code: 'INVALID_ITEMS' 
        }, { status: 400 });
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (supplier_id !== undefined) updateData.supplier_id = supplier_id;
    if (order_number !== undefined) updateData.order_number = order_number;
    if (status !== undefined) updateData.status = status;
    if (items !== undefined) updateData.items = JSON.stringify(items);
    if (total_amount !== undefined) updateData.total_amount = total_amount.toString();
    if (expected_delivery_date !== undefined) updateData.expected_delivery_date = expected_delivery_date;
    if (received_date !== undefined) updateData.received_date = received_date;
    if (notes !== undefined) updateData.notes = notes;

    // Update purchase order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('PUT purchase_orders error:', updateError);
      
      // Handle unique constraint violation
      if (updateError.code === '23505') {
        return NextResponse.json({ 
          error: 'Purchase order number already exists',
          code: 'DUPLICATE_ORDER_NUMBER' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to update purchase order: ' + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json(updatedOrder);

  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove purchase order
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get tenant ID
    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existingOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ 
        error: 'Purchase order not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete purchase order
    const { data: deletedOrder, error: deleteError } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (deleteError) {
      console.error('DELETE purchase_orders error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete purchase order: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Purchase order deleted successfully',
      deletedOrder 
    });

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
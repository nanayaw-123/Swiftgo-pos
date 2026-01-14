import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';

const VALID_STATUSES = ['pending', 'in_transit', 'completed', 'cancelled'];

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const { data: record, error } = await supabase
        .from('stock_transfers')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json(record);
    }

    // List with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const fromStoreId = searchParams.get('from_store_id');
    const toStoreId = searchParams.get('to_store_id');
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    let query = supabase
      .from('stock_transfers')
      .select('*')
      .eq('tenant_id', tenantId);

    // Apply filters
    if (fromStoreId) {
      query = query.eq('from_store_id', parseInt(fromStoreId));
    }
    if (toStoreId) {
      query = query.eq('to_store_id', parseInt(toStoreId));
    }
    if (productId) {
      query = query.eq('product_id', parseInt(productId));
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('transfer_date', startDate);
    }
    if (endDate) {
      query = query.lte('transfer_date', endDate);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: records, error } = await query;

    if (error) {
      console.error('GET list error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch records: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(records || []);
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
    const { to_store_id, product_id, quantity, transfer_date, from_store_id, status, notes } = body;

    // Validate required fields
    if (!to_store_id) {
      return NextResponse.json({ 
        error: 'to_store_id is required',
        code: 'MISSING_TO_STORE_ID' 
      }, { status: 400 });
    }

    if (!product_id) {
      return NextResponse.json({ 
        error: 'product_id is required',
        code: 'MISSING_PRODUCT_ID' 
      }, { status: 400 });
    }

    if (!quantity) {
      return NextResponse.json({ 
        error: 'quantity is required',
        code: 'MISSING_QUANTITY' 
      }, { status: 400 });
    }

    if (!transfer_date) {
      return NextResponse.json({ 
        error: 'transfer_date is required',
        code: 'MISSING_TRANSFER_DATE' 
      }, { status: 400 });
    }

    // Validate quantity is positive integer
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json({ 
        error: 'quantity must be a positive integer',
        code: 'INVALID_QUANTITY' 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate transfer_date is valid ISO timestamp
    if (isNaN(Date.parse(transfer_date))) {
      return NextResponse.json({ 
        error: 'transfer_date must be a valid ISO timestamp',
        code: 'INVALID_TRANSFER_DATE' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Validate to_store_id exists and belongs to tenant
    const { data: toStore, error: toStoreError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', to_store_id)
      .eq('tenant_id', tenantId)
      .single();

    if (toStoreError || !toStore) {
      return NextResponse.json({ 
        error: 'to_store_id does not exist or does not belong to your tenant',
        code: 'INVALID_TO_STORE' 
      }, { status: 400 });
    }

    // Validate from_store_id if provided
    if (from_store_id) {
      const { data: fromStore, error: fromStoreError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', from_store_id)
        .eq('tenant_id', tenantId)
        .single();

      if (fromStoreError || !fromStore) {
        return NextResponse.json({ 
          error: 'from_store_id does not exist or does not belong to your tenant',
          code: 'INVALID_FROM_STORE' 
        }, { status: 400 });
      }
    }

    // Validate product_id exists and belongs to tenant
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ 
        error: 'product_id does not exist or does not belong to your tenant',
        code: 'INVALID_PRODUCT' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create the stock transfer
    const { data: newRecord, error: insertError } = await supabase
      .from('stock_transfers')
      .insert({
        tenant_id: tenantId,
        to_store_id,
        from_store_id: from_store_id || null,
        product_id,
        quantity: quantityNum,
        transfer_date,
        status: status || 'pending',
        notes: notes || null,
        created_by: user.id,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error('POST insert error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create record: ' + insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
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
    const { id, to_store_id, from_store_id, product_id, quantity, transfer_date, status, notes } = body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existingRecord, error: fetchError } = await supabase
      .from('stock_transfers')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Validate and add optional fields
    if (quantity !== undefined) {
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        return NextResponse.json({ 
          error: 'quantity must be a positive integer',
          code: 'INVALID_QUANTITY' 
        }, { status: 400 });
      }
      updates.quantity = quantityNum;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      updates.status = status;
    }

    if (transfer_date !== undefined) {
      if (isNaN(Date.parse(transfer_date))) {
        return NextResponse.json({ 
          error: 'transfer_date must be a valid ISO timestamp',
          code: 'INVALID_TRANSFER_DATE' 
        }, { status: 400 });
      }
      updates.transfer_date = transfer_date;
    }

    if (to_store_id !== undefined) {
      const { data: toStore, error: toStoreError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', to_store_id)
        .eq('tenant_id', tenantId)
        .single();

      if (toStoreError || !toStore) {
        return NextResponse.json({ 
          error: 'to_store_id does not exist or does not belong to your tenant',
          code: 'INVALID_TO_STORE' 
        }, { status: 400 });
      }
      updates.to_store_id = to_store_id;
    }

    if (from_store_id !== undefined) {
      if (from_store_id === null) {
        updates.from_store_id = null;
      } else {
        const { data: fromStore, error: fromStoreError } = await supabase
          .from('stores')
          .select('id')
          .eq('id', from_store_id)
          .eq('tenant_id', tenantId)
          .single();

        if (fromStoreError || !fromStore) {
          return NextResponse.json({ 
            error: 'from_store_id does not exist or does not belong to your tenant',
            code: 'INVALID_FROM_STORE' 
          }, { status: 400 });
        }
        updates.from_store_id = from_store_id;
      }
    }

    if (product_id !== undefined) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', product_id)
        .eq('tenant_id', tenantId)
        .single();

      if (productError || !product) {
        return NextResponse.json({ 
          error: 'product_id does not exist or does not belong to your tenant',
          code: 'INVALID_PRODUCT' 
        }, { status: 400 });
      }
      updates.product_id = product_id;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    // Update the record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('stock_transfers')
      .update(updates)
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('PUT update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update record: ' + updateError.message 
      }, { status: 500 });
    }

    if (!updatedRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRecord);
  } catch (error: any) {
    console.error('PUT error:', error);
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

    const { searchParams } = new URL(request.url);
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
    const { data: existingRecord, error: fetchError } = await supabase
      .from('stock_transfers')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Delete the record
    const { data: deletedRecord, error: deleteError } = await supabase
      .from('stock_transfers')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (deleteError) {
      console.error('DELETE error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete record: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Stock transfer deleted successfully',
      deletedRecord
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
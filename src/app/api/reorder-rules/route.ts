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

    const supabase = getServerSupabase();
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const productId = searchParams.get('product_id');
    const isActive = searchParams.get('is_active');
    const autoGeneratePo = searchParams.get('auto_generate_po');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      const { data, error } = await supabase
        .from('reorder_rules')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // List with filters
    let query = supabase
      .from('reorder_rules')
      .select('*')
      .eq('tenant_id', tenantId);

    if (productId) {
      query = query.eq('product_id', parseInt(productId));
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (autoGeneratePo !== null) {
      query = query.eq('auto_generate_po', autoGeneratePo === 'true');
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
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
    const { 
      product_id, 
      reorder_point, 
      reorder_quantity, 
      preferred_supplier_id,
      auto_generate_po,
      is_active
    } = body;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json({ 
        error: 'Product ID is required',
        code: 'MISSING_PRODUCT_ID' 
      }, { status: 400 });
    }

    if (reorder_point === undefined || reorder_point === null) {
      return NextResponse.json({ 
        error: 'Reorder point is required',
        code: 'MISSING_REORDER_POINT' 
      }, { status: 400 });
    }

    if (reorder_quantity === undefined || reorder_quantity === null) {
      return NextResponse.json({ 
        error: 'Reorder quantity is required',
        code: 'MISSING_REORDER_QUANTITY' 
      }, { status: 400 });
    }

    // Validate positive integers
    if (!Number.isInteger(reorder_point) || reorder_point <= 0) {
      return NextResponse.json({ 
        error: 'Reorder point must be a positive integer',
        code: 'INVALID_REORDER_POINT' 
      }, { status: 400 });
    }

    if (!Number.isInteger(reorder_quantity) || reorder_quantity <= 0) {
      return NextResponse.json({ 
        error: 'Reorder quantity must be a positive integer',
        code: 'INVALID_REORDER_QUANTITY' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Validate product exists and belongs to tenant
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ 
        error: 'Product not found or does not belong to your tenant',
        code: 'INVALID_PRODUCT' 
      }, { status: 400 });
    }

    // Validate supplier if provided
    if (preferred_supplier_id) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', preferred_supplier_id)
        .eq('tenant_id', tenantId)
        .single();

      if (supplierError || !supplier) {
        return NextResponse.json({ 
          error: 'Supplier not found or does not belong to your tenant',
          code: 'INVALID_SUPPLIER' 
        }, { status: 400 });
      }
    }

    // Validate booleans
    if (auto_generate_po !== undefined && typeof auto_generate_po !== 'boolean') {
      return NextResponse.json({ 
        error: 'auto_generate_po must be a boolean',
        code: 'INVALID_AUTO_GENERATE_PO' 
      }, { status: 400 });
    }

    if (is_active !== undefined && typeof is_active !== 'boolean') {
      return NextResponse.json({ 
        error: 'is_active must be a boolean',
        code: 'INVALID_IS_ACTIVE' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const insertData = {
      tenant_id: tenantId,
      product_id,
      reorder_point,
      reorder_quantity,
      preferred_supplier_id: preferred_supplier_id || null,
      auto_generate_po: auto_generate_po ?? false,
      is_active: is_active ?? true,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('reorder_rules')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('POST error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
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
      product_id, 
      reorder_point, 
      reorder_quantity, 
      preferred_supplier_id,
      auto_generate_po,
      is_active
    } = body;

    // Validate ID
    if (!id || !Number.isInteger(id)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check record exists and belongs to tenant
    const { data: existingRecord, error: fetchError } = await supabase
      .from('reorder_rules')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Validate reorder_point if provided
    if (reorder_point !== undefined) {
      if (!Number.isInteger(reorder_point) || reorder_point <= 0) {
        return NextResponse.json({ 
          error: 'Reorder point must be a positive integer',
          code: 'INVALID_REORDER_POINT' 
        }, { status: 400 });
      }
    }

    // Validate reorder_quantity if provided
    if (reorder_quantity !== undefined) {
      if (!Number.isInteger(reorder_quantity) || reorder_quantity <= 0) {
        return NextResponse.json({ 
          error: 'Reorder quantity must be a positive integer',
          code: 'INVALID_REORDER_QUANTITY' 
        }, { status: 400 });
      }
    }

    // Validate product if provided
    if (product_id !== undefined) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', product_id)
        .eq('tenant_id', tenantId)
        .single();

      if (productError || !product) {
        return NextResponse.json({ 
          error: 'Product not found or does not belong to your tenant',
          code: 'INVALID_PRODUCT' 
        }, { status: 400 });
      }
    }

    // Validate supplier if provided
    if (preferred_supplier_id !== undefined && preferred_supplier_id !== null) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', preferred_supplier_id)
        .eq('tenant_id', tenantId)
        .single();

      if (supplierError || !supplier) {
        return NextResponse.json({ 
          error: 'Supplier not found or does not belong to your tenant',
          code: 'INVALID_SUPPLIER' 
        }, { status: 400 });
      }
    }

    // Validate booleans
    if (auto_generate_po !== undefined && typeof auto_generate_po !== 'boolean') {
      return NextResponse.json({ 
        error: 'auto_generate_po must be a boolean',
        code: 'INVALID_AUTO_GENERATE_PO' 
      }, { status: 400 });
    }

    if (is_active !== undefined && typeof is_active !== 'boolean') {
      return NextResponse.json({ 
        error: 'is_active must be a boolean',
        code: 'INVALID_IS_ACTIVE' 
      }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (product_id !== undefined) updateData.product_id = product_id;
    if (reorder_point !== undefined) updateData.reorder_point = reorder_point;
    if (reorder_quantity !== undefined) updateData.reorder_quantity = reorder_quantity;
    if (preferred_supplier_id !== undefined) updateData.preferred_supplier_id = preferred_supplier_id;
    if (auto_generate_po !== undefined) updateData.auto_generate_po = auto_generate_po;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('reorder_rules')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PUT error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(data);
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check record exists and belongs to tenant
    const { data: existingRecord, error: fetchError } = await supabase
      .from('reorder_rules')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('reorder_rules')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Reorder rule deleted successfully',
      data
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
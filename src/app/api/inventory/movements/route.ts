import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

const VALID_MOVEMENT_TYPES = ['in', 'out', 'adjustment'] as const;
type MovementType = typeof VALID_MOVEMENT_TYPES[number];

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

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
    const productId = searchParams.get('productId');
    const storeId = searchParams.get('storeId');
    const movementType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get single movement
    if (id) {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Movement not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(data, { status: 200 });
    }

    // Validate movementType if provided
    if (movementType && !VALID_MOVEMENT_TYPES.includes(movementType as MovementType)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_MOVEMENT_TYPES.join(', ')}`,
        code: 'INVALID_MOVEMENT_TYPE'
      }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .eq('tenant_id', tenantId);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (movementType) {
      query = query.eq('type', movementType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching movements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch movements' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { product_id, store_id, type, quantity, reason } = body;

    if (!product_id || !store_id || !type || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    if (!VALID_MOVEMENT_TYPES.includes(type as MovementType)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_MOVEMENT_TYPES.join(', ')}`,
        code: 'INVALID_MOVEMENT_TYPE'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Create movement
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({
        tenant_id: tenantId,
        product_id,
        store_id,
        type,
        quantity: parseInt(quantity),
        reason: reason || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating movement:', error);
      return NextResponse.json(
        { error: 'Failed to create movement: ' + error.message },
        { status: 500 }
      );
    }

    // Update product stock
    const quantityChange = type === 'out' ? -parseInt(quantity) : parseInt(quantity);
    
    const { error: stockError } = await supabase.rpc('update_product_stock', {
      p_product_id: product_id,
      p_quantity_change: quantityChange
    });

    if (stockError) {
      console.error('Error updating stock:', stockError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
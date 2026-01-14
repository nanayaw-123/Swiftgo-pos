import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

async function getTenantId(userId: string) {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', userId)
    .single();
  
  return data?.tenant_id || null;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const supabase = getServerSupabase()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = await getTenantId(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Get single store
    if (id) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Store not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(data, { status: 200 });
    }

    // Get all stores
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stores' },
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
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const supabase = getServerSupabase()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = await getTenantId(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, location } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenantId,
        name,
        location
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating store:', error);
      return NextResponse.json(
        { error: 'Failed to create store: ' + error.message },
        { status: 500 }
      );
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

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const supabase = getServerSupabase()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = await getTenantId(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, location } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Store ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;

    const { data, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating store:', error);
      return NextResponse.json(
        { error: 'Failed to update store: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const supabase = getServerSupabase()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = await getTenantId(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Store ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting store:', error);
      return NextResponse.json(
        { error: 'Failed to delete store: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

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
    const filterUserId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get single audit log
    if (id) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Audit log not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(data, { status: 200 });
    }

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (resource) {
      query = query.eq('resource', resource);
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
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
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
    const { action, resource, details } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action,
        resource,
        details: details || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return NextResponse.json(
        { error: 'Failed to create audit log: ' + error.message },
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
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
    const isActiveParam = searchParams.get('is_active');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (id) {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    let query = supabase
      .from('loyalty_programs')
      .select('*')
      .eq('tenant_id', tenantId);

    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch loyalty programs: ' + error.message 
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
    const { name, points_per_currency_unit, reward_threshold, reward_value, is_active } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        error: 'Name is required',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    if (!reward_value) {
      return NextResponse.json({ 
        error: 'Reward value is required',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    const pointsPerUnit = points_per_currency_unit ?? 1;
    const threshold = reward_threshold ?? 100;

    if (pointsPerUnit <= 0 || !Number.isInteger(pointsPerUnit)) {
      return NextResponse.json({ 
        error: 'Points per currency unit must be a positive integer',
        code: 'INVALID_POINTS_VALUE' 
      }, { status: 400 });
    }

    if (threshold <= 0 || !Number.isInteger(threshold)) {
      return NextResponse.json({ 
        error: 'Reward threshold must be a positive integer',
        code: 'INVALID_THRESHOLD_VALUE' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('loyalty_programs')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        points_per_currency_unit: pointsPerUnit,
        reward_threshold: threshold,
        reward_value: reward_value.toString(),
        is_active: is_active ?? true,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('POST error:', error);
      return NextResponse.json({ 
        error: 'Failed to create loyalty program: ' + error.message 
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
    const { id, name, points_per_currency_unit, reward_threshold, reward_value, is_active } = body;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 });
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return NextResponse.json({ 
          error: 'Name cannot be empty',
          code: 'INVALID_NAME' 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (points_per_currency_unit !== undefined) {
      if (points_per_currency_unit <= 0 || !Number.isInteger(points_per_currency_unit)) {
        return NextResponse.json({ 
          error: 'Points per currency unit must be a positive integer',
          code: 'INVALID_POINTS_VALUE' 
        }, { status: 400 });
      }
      updates.points_per_currency_unit = points_per_currency_unit;
    }

    if (reward_threshold !== undefined) {
      if (reward_threshold <= 0 || !Number.isInteger(reward_threshold)) {
        return NextResponse.json({ 
          error: 'Reward threshold must be a positive integer',
          code: 'INVALID_THRESHOLD_VALUE' 
        }, { status: 400 });
      }
      updates.reward_threshold = reward_threshold;
    }

    if (reward_value !== undefined) {
      updates.reward_value = reward_value.toString();
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    const { data, error } = await supabase
      .from('loyalty_programs')
      .update(updates)
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PUT error:', error);
      return NextResponse.json({ 
        error: 'Failed to update loyalty program: ' + error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 });
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('loyalty_programs')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ 
        error: 'Failed to delete loyalty program: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Loyalty program deleted successfully',
      deleted: existing
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
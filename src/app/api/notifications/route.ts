import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

const VALID_TYPES = ['low_stock', 'expiry_alert', 'sales_milestone', 'staff_activity', 'system'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

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
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type');
    const isRead = searchParams.get('is_read');
    const priority = searchParams.get('priority');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = getServerSupabase();

    if (id) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId);

    if (userId !== undefined && userId !== null) {
      if (userId === 'null' || userId === '') {
        query = query.is('user_id', null);
      } else {
        query = query.eq('user_id', userId);
      }
    } else {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (isRead !== null && isRead !== undefined) {
      const isReadBool = isRead === 'true' || isRead === '1';
      query = query.eq('is_read', isReadBool);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('GET notifications error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch notifications: ' + error.message 
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
    const { type, title, message, user_id, data_json, priority } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ 
        error: 'Required fields missing: type, title, message',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    const finalPriority = priority || 'medium';
    if (!VALID_PRIORITIES.includes(finalPriority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const insertData: any = {
      tenant_id: tenantId,
      type: type.trim(),
      title: title.trim(),
      message: message.trim(),
      priority: finalPriority,
      is_read: false,
      created_at: new Date().toISOString()
    };

    if (user_id !== undefined && user_id !== null && user_id !== '') {
      insertData.user_id = user_id;
    }

    if (data_json !== undefined && data_json !== null) {
      insertData.data_json = data_json;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('POST notification error:', error);
      return NextResponse.json({ 
        error: 'Failed to create notification: ' + error.message 
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
    const { id, is_read, title, message, data_json, priority } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (is_read !== undefined) {
      updateData.is_read = is_read;
    }

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (message !== undefined) {
      updateData.message = message.trim();
    }

    if (data_json !== undefined) {
      updateData.data_json = data_json;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PUT notification error:', error);
      return NextResponse.json({ 
        error: 'Failed to update notification: ' + error.message 
      }, { status: 500 });
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
      .from('notifications')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('DELETE notification error:', error);
      return NextResponse.json({ 
        error: 'Failed to delete notification: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Notification deleted successfully',
      deleted: existing
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', false)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .select();

    if (error) {
      console.error('PATCH mark-all-read error:', error);
      return NextResponse.json({ 
        error: 'Failed to mark notifications as read: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Notifications marked as read',
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
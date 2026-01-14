import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

const VALID_ALERT_TYPES = ['low_stock', 'expiry_warning', 'sales_milestone', 'staff_activity', 'fraud_detection', 'system_info'];
const VALID_SEVERITIES = ['info', 'warning', 'critical'];

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
    const alertType = searchParams.get('alert_type');
    const severity = searchParams.get('severity');
    const isRead = searchParams.get('is_read');
    const isDismissed = searchParams.get('is_dismissed');
    const relatedId = searchParams.get('related_id');
    const relatedType = searchParams.get('related_type');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = getServerSupabase();

    if (id) {
      const idNum = parseInt(id);
      if (isNaN(idNum)) {
        return NextResponse.json({ error: 'Valid ID is required', code: 'INVALID_ID' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('id', idNum)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    let query = supabase
      .from('system_alerts')
      .select('*')
      .eq('tenant_id', tenantId);

    if (alertType) {
      if (!VALID_ALERT_TYPES.includes(alertType)) {
        return NextResponse.json({ 
          error: `Invalid alert_type. Must be one of: ${VALID_ALERT_TYPES.join(', ')}`,
          code: 'INVALID_ALERT_TYPE'
        }, { status: 400 });
      }
      query = query.eq('alert_type', alertType);
    }

    if (severity) {
      if (!VALID_SEVERITIES.includes(severity)) {
        return NextResponse.json({ 
          error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`,
          code: 'INVALID_SEVERITY'
        }, { status: 400 });
      }
      query = query.eq('severity', severity);
    }

    if (isRead !== null) {
      const isReadBool = isRead === 'true';
      query = query.eq('is_read', isReadBool);
    }

    if (isDismissed !== null) {
      const isDismissedBool = isDismissed === 'true';
      query = query.eq('is_dismissed', isDismissedBool);
    }

    if (relatedId) {
      const relatedIdNum = parseInt(relatedId);
      if (!isNaN(relatedIdNum)) {
        query = query.eq('related_id', relatedIdNum);
      }
    }

    if (relatedType) {
      query = query.eq('related_type', relatedType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);

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
    const { 
      alert_type, 
      severity, 
      title, 
      message, 
      related_id, 
      related_type, 
      action_url,
      is_read,
      is_dismissed
    } = body;

    if (!alert_type || typeof alert_type !== 'string' || alert_type.trim() === '') {
      return NextResponse.json({ 
        error: 'alert_type is required and must be a non-empty string',
        code: 'MISSING_ALERT_TYPE'
      }, { status: 400 });
    }

    if (!VALID_ALERT_TYPES.includes(alert_type)) {
      return NextResponse.json({ 
        error: `Invalid alert_type. Must be one of: ${VALID_ALERT_TYPES.join(', ')}`,
        code: 'INVALID_ALERT_TYPE'
      }, { status: 400 });
    }

    if (!severity || typeof severity !== 'string' || severity.trim() === '') {
      return NextResponse.json({ 
        error: 'severity is required and must be a non-empty string',
        code: 'MISSING_SEVERITY'
      }, { status: 400 });
    }

    if (!VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json({ 
        error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`,
        code: 'INVALID_SEVERITY'
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: 'title is required and must be a non-empty string',
        code: 'MISSING_TITLE'
      }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ 
        error: 'message is required and must be a non-empty string',
        code: 'MISSING_MESSAGE'
      }, { status: 400 });
    }

    if (action_url !== undefined && action_url !== null && typeof action_url !== 'string') {
      return NextResponse.json({ 
        error: 'action_url must be a valid string',
        code: 'INVALID_ACTION_URL'
      }, { status: 400 });
    }

    const insertData: any = {
      tenant_id: tenantId,
      alert_type: alert_type.trim(),
      severity: severity.trim(),
      title: title.trim(),
      message: message.trim(),
      is_read: is_read === true ? true : false,
      is_dismissed: is_dismissed === true ? true : false,
      created_at: new Date().toISOString()
    };

    if (related_id !== undefined && related_id !== null) {
      const relatedIdNum = parseInt(related_id);
      if (!isNaN(relatedIdNum)) {
        insertData.related_id = relatedIdNum;
      }
    }

    if (related_type !== undefined && related_type !== null && typeof related_type === 'string') {
      insertData.related_type = related_type.trim();
    }

    if (action_url !== undefined && action_url !== null && typeof action_url === 'string' && action_url.trim() !== '') {
      insertData.action_url = action_url.trim();
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('system_alerts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('POST error:', error);
      return NextResponse.json({ error: 'Failed to create alert: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
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

    const body = await request.json();
    const { id, is_read, is_dismissed } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'id is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    if (is_read === undefined && is_dismissed === undefined) {
      return NextResponse.json({ 
        error: 'At least one of is_read or is_dismissed must be provided',
        code: 'MISSING_UPDATE_FIELDS'
      }, { status: 400 });
    }

    if (is_read !== undefined && typeof is_read !== 'boolean') {
      return NextResponse.json({ 
        error: 'is_read must be a boolean',
        code: 'INVALID_IS_READ'
      }, { status: 400 });
    }

    if (is_dismissed !== undefined && typeof is_dismissed !== 'boolean') {
      return NextResponse.json({ 
        error: 'is_dismissed must be a boolean',
        code: 'INVALID_IS_DISMISSED'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: existingAlert, error: fetchError } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (is_read !== undefined) {
      updateData.is_read = is_read;
    }
    if (is_dismissed !== undefined) {
      updateData.is_dismissed = is_dismissed;
    }

    const { data, error } = await supabase
      .from('system_alerts')
      .update(updateData)
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update alert: ' + error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('PATCH error:', error);
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

    if (!id) {
      return NextResponse.json({ 
        error: 'ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: existingAlert, error: fetchError } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('system_alerts')
      .delete()
      .eq('id', idNum)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete alert: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Alert deleted successfully',
      deleted: existingAlert
    });

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
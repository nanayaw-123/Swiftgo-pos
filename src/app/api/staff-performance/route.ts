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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const staffId = searchParams.get('staff_id');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const shiftAttendance = searchParams.get('shift_attendance');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = getServerSupabase();

    if (id) {
      const { data, error } = await supabase
        .from('staff_performance')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', parseInt(id))
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    let query = supabase
      .from('staff_performance')
      .select('*')
      .eq('tenant_id', tenantId);

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (shiftAttendance !== null && shiftAttendance !== undefined) {
      const attendanceValue = shiftAttendance === 'true';
      query = query.eq('shift_attendance', attendanceValue);
    }

    const { data, error } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('GET error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch records: ' + error.message 
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
      staff_id, 
      date, 
      sales_count, 
      sales_total, 
      hours_worked, 
      shift_attendance 
    } = body;

    if (!staff_id || typeof staff_id !== 'string' || staff_id.trim() === '') {
      return NextResponse.json({ 
        error: 'staff_id is required and must be a non-empty string',
        code: 'MISSING_STAFF_ID' 
      }, { status: 400 });
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ 
        error: 'date is required and must be in YYYY-MM-DD format',
        code: 'MISSING_DATE' 
      }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ 
        error: 'date must be in valid YYYY-MM-DD format',
        code: 'INVALID_DATE_FORMAT' 
      }, { status: 400 });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ 
        error: 'date must be a valid date',
        code: 'INVALID_DATE' 
      }, { status: 400 });
    }

    const finalSalesCount = sales_count !== undefined ? sales_count : 0;
    if (typeof finalSalesCount !== 'number' || finalSalesCount < 0 || !Number.isInteger(finalSalesCount)) {
      return NextResponse.json({ 
        error: 'sales_count must be a non-negative integer',
        code: 'INVALID_SALES_COUNT' 
      }, { status: 400 });
    }

    const finalSalesTotal = sales_total !== undefined ? sales_total : '0';
    if (typeof finalSalesTotal !== 'string' || isNaN(parseFloat(finalSalesTotal)) || parseFloat(finalSalesTotal) < 0) {
      return NextResponse.json({ 
        error: 'sales_total must be a valid non-negative numeric string',
        code: 'INVALID_SALES_TOTAL' 
      }, { status: 400 });
    }

    const finalHoursWorked = hours_worked !== undefined ? hours_worked : '0';
    if (typeof finalHoursWorked !== 'string' || isNaN(parseFloat(finalHoursWorked)) || parseFloat(finalHoursWorked) < 0) {
      return NextResponse.json({ 
        error: 'hours_worked must be a valid non-negative numeric string',
        code: 'INVALID_HOURS_WORKED' 
      }, { status: 400 });
    }

    const finalShiftAttendance = shift_attendance !== undefined ? shift_attendance : true;
    if (typeof finalShiftAttendance !== 'boolean') {
      return NextResponse.json({ 
        error: 'shift_attendance must be a boolean',
        code: 'INVALID_SHIFT_ATTENDANCE' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('staff_performance')
      .insert({
        tenant_id: tenantId,
        staff_id: staff_id.trim(),
        date,
        sales_count: finalSalesCount,
        sales_total: finalSalesTotal,
        hours_worked: finalHoursWorked,
        shift_attendance: finalShiftAttendance,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('POST error:', error);
      return NextResponse.json({ 
        error: 'Failed to create record: ' + error.message 
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
      staff_id, 
      date, 
      sales_count, 
      sales_total, 
      hours_worked, 
      shift_attendance 
    } = body;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid id is required in request body',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: existingRecord, error: fetchError } = await supabase
      .from('staff_performance')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (staff_id !== undefined) {
      if (typeof staff_id !== 'string' || staff_id.trim() === '') {
        return NextResponse.json({ 
          error: 'staff_id must be a non-empty string',
          code: 'INVALID_STAFF_ID' 
        }, { status: 400 });
      }
      updates.staff_id = staff_id.trim();
    }

    if (date !== undefined) {
      if (typeof date !== 'string') {
        return NextResponse.json({ 
          error: 'date must be a string in YYYY-MM-DD format',
          code: 'INVALID_DATE_TYPE' 
        }, { status: 400 });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json({ 
          error: 'date must be in valid YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT' 
        }, { status: 400 });
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ 
          error: 'date must be a valid date',
          code: 'INVALID_DATE' 
        }, { status: 400 });
      }

      updates.date = date;
    }

    if (sales_count !== undefined) {
      if (typeof sales_count !== 'number' || sales_count < 0 || !Number.isInteger(sales_count)) {
        return NextResponse.json({ 
          error: 'sales_count must be a non-negative integer',
          code: 'INVALID_SALES_COUNT' 
        }, { status: 400 });
      }
      updates.sales_count = sales_count;
    }

    if (sales_total !== undefined) {
      if (typeof sales_total !== 'string' || isNaN(parseFloat(sales_total)) || parseFloat(sales_total) < 0) {
        return NextResponse.json({ 
          error: 'sales_total must be a valid non-negative numeric string',
          code: 'INVALID_SALES_TOTAL' 
        }, { status: 400 });
      }
      updates.sales_total = sales_total;
    }

    if (hours_worked !== undefined) {
      if (typeof hours_worked !== 'string' || isNaN(parseFloat(hours_worked)) || parseFloat(hours_worked) < 0) {
        return NextResponse.json({ 
          error: 'hours_worked must be a valid non-negative numeric string',
          code: 'INVALID_HOURS_WORKED' 
        }, { status: 400 });
      }
      updates.hours_worked = hours_worked;
    }

    if (shift_attendance !== undefined) {
      if (typeof shift_attendance !== 'boolean') {
        return NextResponse.json({ 
          error: 'shift_attendance must be a boolean',
          code: 'INVALID_SHIFT_ATTENDANCE' 
        }, { status: 400 });
      }
      updates.shift_attendance = shift_attendance;
    }

    const { data, error } = await supabase
      .from('staff_performance')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('PUT error:', error);
      return NextResponse.json({ 
        error: 'Failed to update record: ' + error.message 
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

    const { data: existingRecord, error: fetchError } = await supabase
      .from('staff_performance')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('staff_performance')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ 
        error: 'Failed to delete record: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Record deleted successfully',
      deleted: data
    });

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
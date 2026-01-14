import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

// Helper function to calculate total hours
function calculateTotalHours(clockIn: string, clockOut: string, breakDurationMinutes: number): string {
  const clockInDate = new Date(clockIn);
  const clockOutDate = new Date(clockOut);
  const diffMs = clockOutDate.getTime() - clockInDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const totalHours = diffHours - (breakDurationMinutes / 60);
  return totalHours.toFixed(2);
}

// Helper function to validate status
function isValidStatus(status: string): boolean {
  return ['scheduled', 'active', 'completed', 'missed'].includes(status);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found', code: 'TENANT_NOT_FOUND' }, { status: 404 });
    }

    const supabase = getServerSupabase();
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const staffId = searchParams.get('staff_id');
    const storeId = searchParams.get('store_id');
    const status = searchParams.get('status');
    const shiftDate = searchParams.get('shift_date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single shift by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ error: 'Valid ID is required', code: 'INVALID_ID' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('staff_shifts')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Shift not found', code: 'SHIFT_NOT_FOUND' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // List shifts with filters
    let query = supabase
      .from('staff_shifts')
      .select('*')
      .eq('tenant_id', tenantId);

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    if (storeId) {
      if (isNaN(parseInt(storeId))) {
        return NextResponse.json({ error: 'Valid store_id is required', code: 'INVALID_STORE_ID' }, { status: 400 });
      }
      query = query.eq('store_id', parseInt(storeId));
    }

    if (status) {
      if (!isValidStatus(status)) {
        return NextResponse.json({ 
          error: 'Invalid status. Must be one of: scheduled, active, completed, missed', 
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      query = query.eq('status', status);
    }

    if (shiftDate) {
      query = query.eq('shift_date', shiftDate);
    }

    if (startDate) {
      query = query.gte('shift_date', startDate);
    }

    if (endDate) {
      query = query.lte('shift_date', endDate);
    }

    query = query.order('shift_date', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('GET list error:', error);
      return NextResponse.json({ error: 'Failed to fetch shifts: ' + error.message }, { status: 500 });
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
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found', code: 'TENANT_NOT_FOUND' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      staff_id, 
      store_id, 
      shift_date, 
      clock_in, 
      clock_out, 
      break_duration_minutes, 
      status, 
      notes 
    } = body;

    // Validate required fields
    if (!staff_id || !staff_id.trim()) {
      return NextResponse.json({ error: 'staff_id is required', code: 'MISSING_STAFF_ID' }, { status: 400 });
    }

    if (!store_id || isNaN(parseInt(store_id))) {
      return NextResponse.json({ error: 'Valid store_id is required', code: 'MISSING_STORE_ID' }, { status: 400 });
    }

    if (!shift_date || !shift_date.trim()) {
      return NextResponse.json({ error: 'shift_date is required', code: 'MISSING_SHIFT_DATE' }, { status: 400 });
    }

    // Validate status if provided
    const shiftStatus = status || 'scheduled';
    if (!isValidStatus(shiftStatus)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: scheduled, active, completed, missed', 
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate store exists and belongs to tenant
    const supabase = getServerSupabase();
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', parseInt(store_id))
      .eq('tenant_id', tenantId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ 
        error: 'Store not found or does not belong to your tenant', 
        code: 'INVALID_STORE' 
      }, { status: 400 });
    }

    // Calculate total hours if both clock_in and clock_out are provided
    let totalHours = null;
    if (clock_in && clock_out) {
      const breakMinutes = break_duration_minutes || 0;
      totalHours = calculateTotalHours(clock_in, clock_out, breakMinutes);
    }

    const now = new Date().toISOString();
    const insertData: any = {
      tenant_id: tenantId,
      staff_id: staff_id.trim(),
      store_id: parseInt(store_id),
      shift_date: shift_date.trim(),
      clock_in: clock_in || null,
      clock_out: clock_out || null,
      break_duration_minutes: break_duration_minutes || 0,
      total_hours: totalHours,
      status: shiftStatus,
      notes: notes ? notes.trim() : null,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('staff_shifts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('POST error:', error);
      return NextResponse.json({ error: 'Failed to create shift: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found', code: 'TENANT_NOT_FOUND' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      id, 
      staff_id, 
      store_id, 
      shift_date, 
      clock_in, 
      clock_out, 
      break_duration_minutes, 
      status, 
      notes 
    } = body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required', code: 'INVALID_ID' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if shift exists and belongs to tenant
    const { data: existingShift, error: fetchError } = await supabase
      .from('staff_shifts')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingShift) {
      return NextResponse.json({ error: 'Shift not found', code: 'SHIFT_NOT_FOUND' }, { status: 404 });
    }

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: scheduled, active, completed, missed', 
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate store if provided
    if (store_id) {
      if (isNaN(parseInt(store_id))) {
        return NextResponse.json({ error: 'Valid store_id is required', code: 'INVALID_STORE_ID' }, { status: 400 });
      }

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', parseInt(store_id))
        .eq('tenant_id', tenantId)
        .single();

      if (storeError || !store) {
        return NextResponse.json({ 
          error: 'Store not found or does not belong to your tenant', 
          code: 'INVALID_STORE' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (staff_id !== undefined) updateData.staff_id = staff_id.trim();
    if (store_id !== undefined) updateData.store_id = parseInt(store_id);
    if (shift_date !== undefined) updateData.shift_date = shift_date.trim();
    if (clock_in !== undefined) updateData.clock_in = clock_in;
    if (clock_out !== undefined) updateData.clock_out = clock_out;
    if (break_duration_minutes !== undefined) updateData.break_duration_minutes = break_duration_minutes;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    // Recalculate total hours if clock_in or clock_out are being updated
    const finalClockIn = clock_in !== undefined ? clock_in : existingShift.clock_in;
    const finalClockOut = clock_out !== undefined ? clock_out : existingShift.clock_out;
    const finalBreakMinutes = break_duration_minutes !== undefined ? break_duration_minutes : existingShift.break_duration_minutes;

    if (finalClockIn && finalClockOut) {
      updateData.total_hours = calculateTotalHours(finalClockIn, finalClockOut, finalBreakMinutes);
    } else if (clock_in === null || clock_out === null) {
      updateData.total_hours = null;
    }

    const { data, error } = await supabase
      .from('staff_shifts')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PUT error:', error);
      return NextResponse.json({ error: 'Failed to update shift: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found', code: 'TENANT_NOT_FOUND' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required', code: 'INVALID_ID' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if shift exists and belongs to tenant
    const { data: existingShift, error: fetchError } = await supabase
      .from('staff_shifts')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingShift) {
      return NextResponse.json({ error: 'Shift not found', code: 'SHIFT_NOT_FOUND' }, { status: 404 });
    }

    const { error } = await supabase
      .from('staff_shifts')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete shift: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Shift deleted successfully',
      deletedShift: existingShift
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
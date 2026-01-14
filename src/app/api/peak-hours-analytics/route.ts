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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const storeId = searchParams.get('store_id');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hour = searchParams.get('hour');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = getServerSupabase();

    if (id) {
      const idNum = parseInt(id);
      if (isNaN(idNum)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('peak_hours_analytics')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', idNum)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    let query = supabase
      .from('peak_hours_analytics')
      .select('*')
      .eq('tenant_id', tenantId);

    if (storeId) {
      const storeIdNum = parseInt(storeId);
      if (isNaN(storeIdNum)) {
        return NextResponse.json({ 
          error: 'Valid store_id is required',
          code: 'INVALID_STORE_ID' 
        }, { status: 400 });
      }
      query = query.eq('store_id', storeIdNum);
    }

    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json({ 
          error: 'Date must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT' 
        }, { status: 400 });
      }
      query = query.eq('date', date);
    }

    if (startDate && endDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return NextResponse.json({ 
          error: 'Dates must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT' 
        }, { status: 400 });
      }
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (startDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate)) {
        return NextResponse.json({ 
          error: 'Start date must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT' 
        }, { status: 400 });
      }
      query = query.gte('date', startDate);
    } else if (endDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(endDate)) {
        return NextResponse.json({ 
          error: 'End date must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT' 
        }, { status: 400 });
      }
      query = query.lte('date', endDate);
    }

    if (hour !== null) {
      const hourNum = parseInt(hour);
      if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
        return NextResponse.json({ 
          error: 'Hour must be an integer between 0 and 23',
          code: 'INVALID_HOUR' 
        }, { status: 400 });
      }
      query = query.eq('hour', hourNum);
    }

    const { data, error } = await query
      .order('date', { ascending: false })
      .order('hour', { ascending: false })
      .range(offset, offset + limit - 1);

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

    if (!body.store_id) {
      return NextResponse.json({ 
        error: 'store_id is required',
        code: 'MISSING_STORE_ID' 
      }, { status: 400 });
    }

    if (!body.date) {
      return NextResponse.json({ 
        error: 'date is required',
        code: 'MISSING_DATE' 
      }, { status: 400 });
    }

    if (body.hour === undefined || body.hour === null) {
      return NextResponse.json({ 
        error: 'hour is required',
        code: 'MISSING_HOUR' 
      }, { status: 400 });
    }

    const storeId = parseInt(body.store_id);
    if (isNaN(storeId)) {
      return NextResponse.json({ 
        error: 'store_id must be a valid integer',
        code: 'INVALID_STORE_ID' 
      }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json({ 
        error: 'date must be in YYYY-MM-DD format',
        code: 'INVALID_DATE_FORMAT' 
      }, { status: 400 });
    }

    const parsedDate = new Date(body.date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ 
        error: 'date must be a valid date',
        code: 'INVALID_DATE' 
      }, { status: 400 });
    }

    const hour = parseInt(body.hour);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ 
        error: 'hour must be an integer between 0 and 23',
        code: 'INVALID_HOUR' 
      }, { status: 400 });
    }

    const salesCount = body.sales_count !== undefined ? parseInt(body.sales_count) : 0;
    if (isNaN(salesCount) || salesCount < 0) {
      return NextResponse.json({ 
        error: 'sales_count must be a non-negative integer',
        code: 'INVALID_SALES_COUNT' 
      }, { status: 400 });
    }

    const salesTotal = body.sales_total !== undefined ? body.sales_total.toString() : '0';
    const salesTotalNum = parseFloat(salesTotal);
    if (isNaN(salesTotalNum) || salesTotalNum < 0) {
      return NextResponse.json({ 
        error: 'sales_total must be a valid non-negative numeric string',
        code: 'INVALID_SALES_TOTAL' 
      }, { status: 400 });
    }

    const customerCount = body.customer_count !== undefined ? parseInt(body.customer_count) : 0;
    if (isNaN(customerCount) || customerCount < 0) {
      return NextResponse.json({ 
        error: 'customer_count must be a non-negative integer',
        code: 'INVALID_CUSTOMER_COUNT' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('tenant_id', tenantId)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ 
        error: 'Store not found or does not belong to tenant',
        code: 'INVALID_STORE' 
      }, { status: 400 });
    }

    const insertData = {
      tenant_id: tenantId,
      store_id: storeId,
      date: body.date,
      hour: hour,
      sales_count: salesCount,
      sales_total: salesTotal,
      customer_count: customerCount,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('peak_hours_analytics')
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

    const { data: existingRecord, error: fetchError } = await supabase
      .from('peak_hours_analytics')
      .select('*')
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('peak_hours_analytics')
      .delete()
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
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
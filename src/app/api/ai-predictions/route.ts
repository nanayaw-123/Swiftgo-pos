import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';

const VALID_PREDICTION_TYPES = ['inventory_reorder', 'sales_forecast', 'fraud_alert', 'customer_churn', 'demand_spike'];
const VALID_STATUS_VALUES = ['active', 'resolved', 'dismissed'];
const VALID_SUBJECT_TYPES = ['product', 'customer', 'sale'];

function validateConfidenceScore(score: string): boolean {
  const numScore = parseFloat(score);
  return !isNaN(numScore) && numScore >= 0 && numScore <= 1;
}

function validateDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

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
    const predictionType = searchParams.get('prediction_type');
    const status = searchParams.get('status');
    const subjectId = searchParams.get('subject_id');
    const subjectType = searchParams.get('subject_type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      const idNum = parseInt(id);
      if (isNaN(idNum)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('id', idNum)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // List with filters
    let query = supabase
      .from('ai_predictions')
      .select('*')
      .eq('tenant_id', tenantId);

    // Apply filters
    if (predictionType) {
      if (!VALID_PREDICTION_TYPES.includes(predictionType)) {
        return NextResponse.json({ 
          error: `Invalid prediction_type. Must be one of: ${VALID_PREDICTION_TYPES.join(', ')}`,
          code: 'INVALID_PREDICTION_TYPE' 
        }, { status: 400 });
      }
      query = query.eq('prediction_type', predictionType);
    }

    if (status) {
      if (!VALID_STATUS_VALUES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      query = query.eq('status', status);
    }

    if (subjectId) {
      const subjectIdNum = parseInt(subjectId);
      if (isNaN(subjectIdNum)) {
        return NextResponse.json({ 
          error: 'Valid subject_id is required',
          code: 'INVALID_SUBJECT_ID' 
        }, { status: 400 });
      }
      query = query.eq('subject_id', subjectIdNum);
    }

    if (subjectType) {
      if (!VALID_SUBJECT_TYPES.includes(subjectType)) {
        return NextResponse.json({ 
          error: `Invalid subject_type. Must be one of: ${VALID_SUBJECT_TYPES.join(', ')}`,
          code: 'INVALID_SUBJECT_TYPE' 
        }, { status: 400 });
      }
      query = query.eq('subject_type', subjectType);
    }

    if (startDate) {
      if (!validateDate(startDate)) {
        return NextResponse.json({ 
          error: 'Invalid startDate format. Use YYYY-MM-DD',
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
      query = query.gte('predicted_for_date', startDate);
    }

    if (endDate) {
      if (!validateDate(endDate)) {
        return NextResponse.json({ 
          error: 'Invalid endDate format. Use YYYY-MM-DD',
          code: 'INVALID_END_DATE' 
        }, { status: 400 });
      }
      query = query.lte('predicted_for_date', endDate);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

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

    // Validate required fields
    if (!body.prediction_type) {
      return NextResponse.json({ 
        error: 'prediction_type is required',
        code: 'MISSING_PREDICTION_TYPE' 
      }, { status: 400 });
    }

    if (!body.confidence_score) {
      return NextResponse.json({ 
        error: 'confidence_score is required',
        code: 'MISSING_CONFIDENCE_SCORE' 
      }, { status: 400 });
    }

    // Validate prediction_type
    if (!VALID_PREDICTION_TYPES.includes(body.prediction_type)) {
      return NextResponse.json({ 
        error: `Invalid prediction_type. Must be one of: ${VALID_PREDICTION_TYPES.join(', ')}`,
        code: 'INVALID_PREDICTION_TYPE' 
      }, { status: 400 });
    }

    // Validate confidence_score
    if (!validateConfidenceScore(body.confidence_score)) {
      return NextResponse.json({ 
        error: 'confidence_score must be a numeric value between 0.00 and 1.00',
        code: 'INVALID_CONFIDENCE_SCORE' 
      }, { status: 400 });
    }

    // Validate status if provided
    if (body.status && !VALID_STATUS_VALUES.includes(body.status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate subject_type if provided
    if (body.subject_type && !VALID_SUBJECT_TYPES.includes(body.subject_type)) {
      return NextResponse.json({ 
        error: `Invalid subject_type. Must be one of: ${VALID_SUBJECT_TYPES.join(', ')}`,
        code: 'INVALID_SUBJECT_TYPE' 
      }, { status: 400 });
    }

    // Validate predicted_for_date if provided
    if (body.predicted_for_date && !validateDate(body.predicted_for_date)) {
      return NextResponse.json({ 
        error: 'Invalid predicted_for_date format. Use YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT' 
      }, { status: 400 });
    }

    // Validate prediction_data is valid JSON object if provided
    if (body.prediction_data !== undefined && body.prediction_data !== null) {
      if (typeof body.prediction_data !== 'object' || Array.isArray(body.prediction_data)) {
        return NextResponse.json({ 
          error: 'prediction_data must be a valid JSON object',
          code: 'INVALID_PREDICTION_DATA' 
        }, { status: 400 });
      }
    }

    const supabase = getServerSupabase();
    const now = new Date().toISOString();

    const insertData = {
      tenant_id: tenantId,
      prediction_type: body.prediction_type,
      subject_id: body.subject_id || null,
      subject_type: body.subject_type || null,
      prediction_data: body.prediction_data || null,
      confidence_score: body.confidence_score,
      status: body.status || 'active',
      predicted_for_date: body.predicted_for_date || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('ai_predictions')
      .insert(insertData)
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

    // Validate ID
    if (!body.id) {
      return NextResponse.json({ 
        error: 'id is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    const id = parseInt(body.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        error: 'Valid id is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Validate prediction_type if provided
    if (body.prediction_type && !VALID_PREDICTION_TYPES.includes(body.prediction_type)) {
      return NextResponse.json({ 
        error: `Invalid prediction_type. Must be one of: ${VALID_PREDICTION_TYPES.join(', ')}`,
        code: 'INVALID_PREDICTION_TYPE' 
      }, { status: 400 });
    }

    // Validate confidence_score if provided
    if (body.confidence_score !== undefined && !validateConfidenceScore(body.confidence_score)) {
      return NextResponse.json({ 
        error: 'confidence_score must be a numeric value between 0.00 and 1.00',
        code: 'INVALID_CONFIDENCE_SCORE' 
      }, { status: 400 });
    }

    // Validate status if provided
    if (body.status && !VALID_STATUS_VALUES.includes(body.status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate subject_type if provided
    if (body.subject_type && !VALID_SUBJECT_TYPES.includes(body.subject_type)) {
      return NextResponse.json({ 
        error: `Invalid subject_type. Must be one of: ${VALID_SUBJECT_TYPES.join(', ')}`,
        code: 'INVALID_SUBJECT_TYPE' 
      }, { status: 400 });
    }

    // Validate predicted_for_date if provided
    if (body.predicted_for_date && !validateDate(body.predicted_for_date)) {
      return NextResponse.json({ 
        error: 'Invalid predicted_for_date format. Use YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT' 
      }, { status: 400 });
    }

    // Validate prediction_data is valid JSON object if provided
    if (body.prediction_data !== undefined && body.prediction_data !== null) {
      if (typeof body.prediction_data !== 'object' || Array.isArray(body.prediction_data)) {
        return NextResponse.json({ 
          error: 'prediction_data must be a valid JSON object',
          code: 'INVALID_PREDICTION_DATA' 
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.prediction_type !== undefined) updateData.prediction_type = body.prediction_type;
    if (body.subject_id !== undefined) updateData.subject_id = body.subject_id;
    if (body.subject_type !== undefined) updateData.subject_type = body.subject_type;
    if (body.prediction_data !== undefined) updateData.prediction_data = body.prediction_data;
    if (body.confidence_score !== undefined) updateData.confidence_score = body.confidence_score;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.predicted_for_date !== undefined) updateData.predicted_for_date = body.predicted_for_date;

    const { data, error } = await supabase
      .from('ai_predictions')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'id is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json({ 
        error: 'Valid id is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('ai_predictions')
      .delete()
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
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
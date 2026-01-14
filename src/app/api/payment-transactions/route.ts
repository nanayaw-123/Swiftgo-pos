import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';

const VALID_PAYMENT_GATEWAYS = ['stripe', 'paystack', 'flutterwave', 'cash', 'internal'];
const VALID_PAYMENT_METHODS = ['card', 'mobile_money', 'bank_transfer', 'cash'];
const VALID_MOBILE_MONEY_PROVIDERS = ['mtn', 'vodafone', 'airteltigo'];
const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'];

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateAmount(amount: string): boolean {
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0;
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
    const saleId = searchParams.get('sale_id');
    const paymentGateway = searchParams.get('payment_gateway');
    const paymentMethod = searchParams.get('payment_method');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerPhone = searchParams.get('customer_phone');
    const customerEmail = searchParams.get('customer_email');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate enum values if provided
    if (paymentGateway && !VALID_PAYMENT_GATEWAYS.includes(paymentGateway)) {
      return NextResponse.json({ 
        error: `Invalid payment_gateway. Must be one of: ${VALID_PAYMENT_GATEWAYS.join(', ')}`,
        code: 'INVALID_PAYMENT_GATEWAY'
      }, { status: 400 });
    }

    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ 
        error: `Invalid payment_method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Single record fetch
    if (id) {
      const idNum = parseInt(id);
      if (isNaN(idNum)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('payment_transactions')
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
      .from('payment_transactions')
      .select('*')
      .eq('tenant_id', tenantId);

    if (saleId) {
      query = query.eq('sale_id', saleId);
    }

    if (paymentGateway) {
      query = query.eq('payment_gateway', paymentGateway);
    }

    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (customerPhone) {
      query = query.eq('customer_phone', customerPhone);
    }

    if (customerEmail) {
      query = query.eq('customer_email', customerEmail.toLowerCase());
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
      console.error('GET list error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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

    // Security check: reject if tenant_id provided in body
    if ('tenant_id' in body) {
      return NextResponse.json({ 
        error: "Tenant ID cannot be provided in request body",
        code: "TENANT_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!body.payment_gateway) {
      return NextResponse.json({ 
        error: "payment_gateway is required",
        code: "MISSING_PAYMENT_GATEWAY"
      }, { status: 400 });
    }

    if (!body.payment_method) {
      return NextResponse.json({ 
        error: "payment_method is required",
        code: "MISSING_PAYMENT_METHOD"
      }, { status: 400 });
    }

    if (!body.amount) {
      return NextResponse.json({ 
        error: "amount is required",
        code: "MISSING_AMOUNT"
      }, { status: 400 });
    }

    // Validate enum values
    if (!VALID_PAYMENT_GATEWAYS.includes(body.payment_gateway)) {
      return NextResponse.json({ 
        error: `Invalid payment_gateway. Must be one of: ${VALID_PAYMENT_GATEWAYS.join(', ')}`,
        code: 'INVALID_PAYMENT_GATEWAY'
      }, { status: 400 });
    }

    if (!VALID_PAYMENT_METHODS.includes(body.payment_method)) {
      return NextResponse.json({ 
        error: `Invalid payment_method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      }, { status: 400 });
    }

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    if (body.mobile_money_provider && !VALID_MOBILE_MONEY_PROVIDERS.includes(body.mobile_money_provider)) {
      return NextResponse.json({ 
        error: `Invalid mobile_money_provider. Must be one of: ${VALID_MOBILE_MONEY_PROVIDERS.join(', ')}`,
        code: 'INVALID_MOBILE_MONEY_PROVIDER'
      }, { status: 400 });
    }

    // Validate amount
    if (!validateAmount(body.amount)) {
      return NextResponse.json({ 
        error: "amount must be a valid positive number",
        code: 'INVALID_AMOUNT'
      }, { status: 400 });
    }

    // Validate email if provided
    if (body.customer_email && !validateEmail(body.customer_email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    // Validate metadata if provided
    if (body.metadata && typeof body.metadata !== 'object') {
      return NextResponse.json({ 
        error: "metadata must be a valid JSON object",
        code: 'INVALID_METADATA'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const now = new Date().toISOString();

    const insertData = {
      tenant_id: tenantId,
      sale_id: body.sale_id || null,
      payment_gateway: body.payment_gateway,
      gateway_transaction_id: body.gateway_transaction_id || null,
      payment_method: body.payment_method,
      mobile_money_provider: body.mobile_money_provider || null,
      amount: body.amount,
      currency: body.currency || 'GHS',
      status: body.status || 'pending',
      customer_phone: body.customer_phone || null,
      customer_email: body.customer_email ? body.customer_email.toLowerCase() : null,
      metadata: body.metadata || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('payment_transactions')
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

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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

    // Security check: reject if tenant_id provided in body
    if ('tenant_id' in body) {
      return NextResponse.json({ 
        error: "Tenant ID cannot be provided in request body",
        code: "TENANT_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    if (!body.id) {
      return NextResponse.json({ 
        error: "id is required in request body",
        code: "MISSING_ID"
      }, { status: 400 });
    }

    const id = parseInt(body.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Validate enum values if provided
    if (body.payment_gateway && !VALID_PAYMENT_GATEWAYS.includes(body.payment_gateway)) {
      return NextResponse.json({ 
        error: `Invalid payment_gateway. Must be one of: ${VALID_PAYMENT_GATEWAYS.join(', ')}`,
        code: 'INVALID_PAYMENT_GATEWAY'
      }, { status: 400 });
    }

    if (body.payment_method && !VALID_PAYMENT_METHODS.includes(body.payment_method)) {
      return NextResponse.json({ 
        error: `Invalid payment_method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      }, { status: 400 });
    }

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    if (body.mobile_money_provider && !VALID_MOBILE_MONEY_PROVIDERS.includes(body.mobile_money_provider)) {
      return NextResponse.json({ 
        error: `Invalid mobile_money_provider. Must be one of: ${VALID_MOBILE_MONEY_PROVIDERS.join(', ')}`,
        code: 'INVALID_MOBILE_MONEY_PROVIDER'
      }, { status: 400 });
    }

    // Validate amount if provided
    if (body.amount && !validateAmount(body.amount)) {
      return NextResponse.json({ 
        error: "amount must be a valid positive number",
        code: 'INVALID_AMOUNT'
      }, { status: 400 });
    }

    // Validate email if provided
    if (body.customer_email && !validateEmail(body.customer_email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    // Validate metadata if provided
    if (body.metadata !== undefined && body.metadata !== null && typeof body.metadata !== 'object') {
      return NextResponse.json({ 
        error: "metadata must be a valid JSON object",
        code: 'INVALID_METADATA'
      }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are provided
    if (body.sale_id !== undefined) updateData.sale_id = body.sale_id;
    if (body.payment_gateway !== undefined) updateData.payment_gateway = body.payment_gateway;
    if (body.gateway_transaction_id !== undefined) updateData.gateway_transaction_id = body.gateway_transaction_id;
    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method;
    if (body.mobile_money_provider !== undefined) updateData.mobile_money_provider = body.mobile_money_provider;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.customer_phone !== undefined) updateData.customer_phone = body.customer_phone;
    if (body.customer_email !== undefined) updateData.customer_email = body.customer_email ? body.customer_email.toLowerCase() : null;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const { data, error } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PUT error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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
        error: "ID is required",
        code: "MISSING_ID"
      }, { status: 400 });
    }

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', idNum)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('payment_transactions')
      .delete()
      .eq('id', idNum)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Payment transaction deleted successfully',
      deleted: existing
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
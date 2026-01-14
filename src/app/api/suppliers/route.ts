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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single supplier fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', parseInt(id))
        .eq('tenant_id', tenantId)
        .single();

      if (error || !supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }

      return NextResponse.json(supplier);
    }

    // List with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: suppliers, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('GET suppliers error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch suppliers: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(suppliers || []);
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
    const { name, contact_person, email, phone, address, payment_terms, notes } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Name is required and must be a non-empty string',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const now = new Date().toISOString();

    const insertData = {
      tenant_id: tenantId,
      name: name.trim(),
      contact_person: contact_person?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      payment_terms: payment_terms?.trim() || null,
      notes: notes?.trim() || null,
      created_at: now,
      updated_at: now
    };

    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('POST supplier error:', error);
      return NextResponse.json({ 
        error: 'Failed to create supplier: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(newSupplier, { status: 201 });
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
    const { id, name, contact_person, email, phone, address, payment_terms, notes } = body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required in request body',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if supplier exists and belongs to tenant
    const { data: existingSupplier, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ 
          error: 'Name must be a non-empty string',
          code: 'INVALID_FIELD' 
        }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (contact_person !== undefined) {
      updateData.contact_person = contact_person?.trim() || null;
    }

    if (email !== undefined) {
      updateData.email = email?.trim().toLowerCase() || null;
    }

    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    if (address !== undefined) {
      updateData.address = address?.trim() || null;
    }

    if (payment_terms !== undefined) {
      updateData.payment_terms = payment_terms?.trim() || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    const { data: updatedSupplier, error: updateError } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('PUT supplier error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update supplier: ' + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json(updatedSupplier);
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if supplier exists and belongs to tenant
    const { data: existingSupplier, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('DELETE supplier error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete supplier: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Supplier deleted successfully',
      deleted: existingSupplier
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
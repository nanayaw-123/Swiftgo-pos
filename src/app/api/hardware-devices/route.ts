import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';

const VALID_DEVICE_TYPES = ['printer', 'scanner', 'cash_drawer', 'card_reader', 'scale'] as const;
const VALID_CONNECTION_TYPES = ['usb', 'bluetooth', 'network', 'serial'] as const;

type DeviceType = typeof VALID_DEVICE_TYPES[number];
type ConnectionType = typeof VALID_CONNECTION_TYPES[number];

interface HardwareDevice {
  id?: number;
  tenant_id: number;
  store_id: number;
  device_type: DeviceType;
  device_name: string;
  connection_type: ConnectionType;
  device_id: string;
  configuration?: Record<string, any> | null;
  is_active: boolean;
  last_connected_at?: string | null;
  created_at: string;
  updated_at: string;
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
    const storeId = searchParams.get('store_id');
    const deviceType = searchParams.get('device_type');
    const connectionType = searchParams.get('connection_type');
    const isActiveParam = searchParams.get('is_active');
    const deviceId = searchParams.get('device_id');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate enum values if provided
    if (deviceType && !VALID_DEVICE_TYPES.includes(deviceType as DeviceType)) {
      return NextResponse.json({ 
        error: `Invalid device_type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
        code: 'INVALID_DEVICE_TYPE'
      }, { status: 400 });
    }

    if (connectionType && !VALID_CONNECTION_TYPES.includes(connectionType as ConnectionType)) {
      return NextResponse.json({ 
        error: `Invalid connection_type. Must be one of: ${VALID_CONNECTION_TYPES.join(', ')}`,
        code: 'INVALID_CONNECTION_TYPE'
      }, { status: 400 });
    }

    // Single record by ID
    if (id) {
      const deviceIdInt = parseInt(id);
      if (isNaN(deviceIdInt)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('hardware_devices')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', deviceIdInt)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // List with filters
    let query = supabase
      .from('hardware_devices')
      .select('*')
      .eq('tenant_id', tenantId);

    if (storeId) {
      const storeIdInt = parseInt(storeId);
      if (!isNaN(storeIdInt)) {
        query = query.eq('store_id', storeIdInt);
      }
    }

    if (deviceType) {
      query = query.eq('device_type', deviceType);
    }

    if (connectionType) {
      query = query.eq('connection_type', connectionType);
    }

    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      query = query.eq('is_active', isActive);
    }

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('GET error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
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
      store_id, 
      device_type, 
      device_name, 
      connection_type, 
      device_id,
      configuration,
      is_active,
      last_connected_at
    } = body;

    // Validate required fields
    if (!store_id) {
      return NextResponse.json({ 
        error: 'store_id is required',
        code: 'MISSING_STORE_ID'
      }, { status: 400 });
    }

    if (!device_type) {
      return NextResponse.json({ 
        error: 'device_type is required',
        code: 'MISSING_DEVICE_TYPE'
      }, { status: 400 });
    }

    if (!device_name || device_name.trim() === '') {
      return NextResponse.json({ 
        error: 'device_name is required',
        code: 'MISSING_DEVICE_NAME'
      }, { status: 400 });
    }

    if (!connection_type) {
      return NextResponse.json({ 
        error: 'connection_type is required',
        code: 'MISSING_CONNECTION_TYPE'
      }, { status: 400 });
    }

    if (!device_id || device_id.trim() === '') {
      return NextResponse.json({ 
        error: 'device_id is required',
        code: 'MISSING_DEVICE_ID'
      }, { status: 400 });
    }

    // Validate enum values
    if (!VALID_DEVICE_TYPES.includes(device_type)) {
      return NextResponse.json({ 
        error: `Invalid device_type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
        code: 'INVALID_DEVICE_TYPE'
      }, { status: 400 });
    }

    if (!VALID_CONNECTION_TYPES.includes(connection_type)) {
      return NextResponse.json({ 
        error: `Invalid connection_type. Must be one of: ${VALID_CONNECTION_TYPES.join(', ')}`,
        code: 'INVALID_CONNECTION_TYPE'
      }, { status: 400 });
    }

    // Validate configuration is valid JSON object if provided
    if (configuration !== undefined && configuration !== null) {
      if (typeof configuration !== 'object' || Array.isArray(configuration)) {
        return NextResponse.json({ 
          error: 'configuration must be a valid JSON object',
          code: 'INVALID_CONFIGURATION'
        }, { status: 400 });
      }
    }

    // Validate last_connected_at is valid ISO timestamp if provided
    if (last_connected_at) {
      const timestamp = new Date(last_connected_at);
      if (isNaN(timestamp.getTime())) {
        return NextResponse.json({ 
          error: 'last_connected_at must be a valid ISO timestamp',
          code: 'INVALID_TIMESTAMP'
        }, { status: 400 });
      }
    }

    const supabase = getServerSupabase();

    // Validate store exists and belongs to tenant
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ 
        error: 'Store not found or does not belong to your tenant',
        code: 'INVALID_STORE'
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newDevice: Omit<HardwareDevice, 'id'> = {
      tenant_id: tenantId,
      store_id: parseInt(store_id),
      device_type: device_type.trim(),
      device_name: device_name.trim(),
      connection_type: connection_type.trim(),
      device_id: device_id.trim(),
      configuration: configuration ?? null,
      is_active: typeof is_active === 'boolean' ? is_active : true,
      last_connected_at: last_connected_at ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('hardware_devices')
      .insert(newDevice)
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
      store_id, 
      device_type, 
      device_name, 
      connection_type, 
      device_id,
      configuration,
      is_active,
      last_connected_at
    } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'id is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    const deviceIdInt = parseInt(id);
    if (isNaN(deviceIdInt)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from('hardware_devices')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', deviceIdInt)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Validate enum values if provided
    if (device_type && !VALID_DEVICE_TYPES.includes(device_type)) {
      return NextResponse.json({ 
        error: `Invalid device_type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
        code: 'INVALID_DEVICE_TYPE'
      }, { status: 400 });
    }

    if (connection_type && !VALID_CONNECTION_TYPES.includes(connection_type)) {
      return NextResponse.json({ 
        error: `Invalid connection_type. Must be one of: ${VALID_CONNECTION_TYPES.join(', ')}`,
        code: 'INVALID_CONNECTION_TYPE'
      }, { status: 400 });
    }

    // Validate device_name if provided
    if (device_name !== undefined && device_name.trim() === '') {
      return NextResponse.json({ 
        error: 'device_name cannot be empty',
        code: 'INVALID_DEVICE_NAME'
      }, { status: 400 });
    }

    // Validate device_id if provided
    if (device_id !== undefined && device_id.trim() === '') {
      return NextResponse.json({ 
        error: 'device_id cannot be empty',
        code: 'INVALID_DEVICE_ID'
      }, { status: 400 });
    }

    // Validate configuration if provided
    if (configuration !== undefined && configuration !== null) {
      if (typeof configuration !== 'object' || Array.isArray(configuration)) {
        return NextResponse.json({ 
          error: 'configuration must be a valid JSON object',
          code: 'INVALID_CONFIGURATION'
        }, { status: 400 });
      }
    }

    // Validate last_connected_at if provided
    if (last_connected_at) {
      const timestamp = new Date(last_connected_at);
      if (isNaN(timestamp.getTime())) {
        return NextResponse.json({ 
          error: 'last_connected_at must be a valid ISO timestamp',
          code: 'INVALID_TIMESTAMP'
        }, { status: 400 });
      }
    }

    // Validate store_id if provided
    if (store_id !== undefined) {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('id', store_id)
        .single();

      if (storeError || !store) {
        return NextResponse.json({ 
          error: 'Store not found or does not belong to your tenant',
          code: 'INVALID_STORE'
        }, { status: 400 });
      }
    }

    const updates: Partial<HardwareDevice> = {
      updated_at: new Date().toISOString(),
    };

    if (store_id !== undefined) updates.store_id = parseInt(store_id);
    if (device_type !== undefined) updates.device_type = device_type.trim();
    if (device_name !== undefined) updates.device_name = device_name.trim();
    if (connection_type !== undefined) updates.connection_type = connection_type.trim();
    if (device_id !== undefined) updates.device_id = device_id.trim();
    if (configuration !== undefined) updates.configuration = configuration;
    if (is_active !== undefined) updates.is_active = is_active;
    if (last_connected_at !== undefined) updates.last_connected_at = last_connected_at;

    // Update last_connected_at if is_active changes to true
    if (is_active === true && existing.is_active === false) {
      updates.last_connected_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('hardware_devices')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', deviceIdInt)
      .select()
      .single();

    if (error) {
      console.error('PUT error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
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
        error: 'ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    const deviceIdInt = parseInt(id);
    if (isNaN(deviceIdInt)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Check if record exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from('hardware_devices')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', deviceIdInt)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('hardware_devices')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', deviceIdInt);

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Hardware device deleted successfully',
      deleted: existing
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
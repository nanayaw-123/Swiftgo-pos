import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const tenantId = await getTenantIdFromUser(user.id);
    
    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const supabase = getServerSupabase();

    // Get total sales count and revenue
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total')
      .eq('tenant_id', tenantId);

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      return NextResponse.json(
        { error: 'Failed to fetch sales data' },
        { status: 500 }
      );
    }

    const totalSales = salesData?.length || 0;
    const totalRevenue = salesData?.reduce((sum: number, sale: { total: { toString: () => string; }; }) => sum + parseFloat(sale.total.toString()), 0) || 0;

    // Get total products count and low stock count
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('stock')
      .eq('tenant_id', tenantId);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products data' },
        { status: 500 }
      );
    }

    const totalProducts = productsData?.length || 0;
    const lowStockProducts = productsData?.filter((p: { stock: number; }) => p.stock < 10).length || 0;

    // Get stores count
    const { count: storesCount, error: storesError } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (storesError) {
      console.error('Error fetching stores count:', storesError);
    }

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todaySalesData, error: todaySalesError } = await supabase
      .from('sales')
      .select('total')
      .eq('tenant_id', tenantId)
      .gte('created_at', today.toISOString());

    if (todaySalesError) {
      console.error('Error fetching today sales:', todaySalesError);
    }

    const todaySales = todaySalesData?.length || 0;
    const todayRevenue = todaySalesData?.reduce((sum: number, sale: { total: { toString: () => string; }; }) => sum + parseFloat(sale.total.toString()), 0) || 0;

    return NextResponse.json({
      totalSales,
      totalRevenue: totalRevenue.toFixed(2),
      totalProducts,
      lowStockProducts,
      totalStores: storesCount || 0,
      todaySales,
      todayRevenue: todayRevenue.toFixed(2)
    }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
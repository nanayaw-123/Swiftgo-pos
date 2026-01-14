import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getTenantIdFromUser } from '@/lib/auth-server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { store_id, items, total, payment_method, customer_id, is_credit, amount_paid, momo_network } = body;

    if (!store_id || !items || !Array.isArray(items) || items.length === 0 || !total || !payment_method) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // 1. Create sale transaction
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        business_id: tenantId,
        branch_id: store_id,
        cashier_id: user.id,
        total_amount: parseFloat(total),
        payment_method,
        status: is_credit ? 'pending' : 'completed',
        is_offline: false
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // 2. Create sale items
    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) throw itemsError

    // 3. Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        sale_id: sale.id,
        method: payment_method,
        amount: parseFloat(amount_paid || 0),
        reference: `POS-${Date.now()}`,
        status: payment_method === 'momo' ? 'pending' : 'confirmed'
      })

    if (paymentError) throw paymentError

    // 4. If it's a credit sale, record debt
    if (is_credit && customer_id) {
      const debtAmount = parseFloat(total) - parseFloat(amount_paid || 0)
      await supabase
        .from('debts')
        .insert({
          customer_id,
          sale_id: sale.id,
          amount_owed: debtAmount,
          amount_paid: 0,
          status: 'open'
        })
    }

    // 5. Update stock & inventory movements
    for (const item of items) {
      // Decrease stock
      await supabase.rpc('decrease_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity
      });

      // Record movement
      await supabase
        .from('inventory_movements')
        .insert({
          product_id: item.product_id,
          branch_id: store_id,
          type: 'sale',
          quantity: item.quantity
        });
    }

    return NextResponse.json({
      success: true,
      sale_id: sale.id,
      sale
    }, { status: 201 });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

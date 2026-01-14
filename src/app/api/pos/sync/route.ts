import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, action, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    switch (type) {
      case 'sale':
        return await syncSale(data)
      case 'product':
        return await syncProduct(action, data)
      case 'customer':
        return await syncCustomer(action, data)
      case 'debt_payment':
        return await syncDebtPayment(data)
      default:
        return NextResponse.json({ error: 'Unknown sync type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

async function syncSale(data: Record<string, unknown>) {
  const existingSale = await supabase
    .from('sales')
    .select('id')
    .eq('offline_id', data.offline_id)
    .single()

  if (existingSale.data) {
    return NextResponse.json({ 
      id: existingSale.data.id, 
      message: 'Sale already synced' 
    })
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      tenant_id: data.tenant_id,
      store_id: data.store_id,
      customer_id: data.customer_id,
      cashier_id: data.cashier_id,
      amount: data.total,
      total: data.total,
      cost_total: data.cost_total,
      amount_paid: data.amount_paid,
      payment_method: data.payment_method,
      is_credit: data.is_credit,
      debt_due_date: data.debt_due_date,
      status: data.status,
      notes: data.notes,
      is_offline: true,
      offline_id: data.offline_id,
      synced_at: new Date().toISOString(),
      items: data.items,
      created_at: data.created_at
    })
    .select()
    .single()

  if (saleError) {
    throw new Error(`Failed to create sale: ${saleError.message}`)
  }

  const items = data.items as Array<Record<string, unknown>>
  if (items && items.length > 0) {
    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      discount: item.discount || 0,
      total: item.total
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) {
      console.error('Failed to create sale items:', itemsError)
    }

    for (const item of items) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity
      })

      if (stockError) {
        await supabase
          .from('products')
          .update({ 
            stock: supabase.rpc('greatest', { a: 0, b: supabase.rpc('stock_minus', { product_id: item.product_id, qty: item.quantity }) })
          })
          .eq('id', item.product_id)
      }

      await supabase
        .from('inventory_movements')
        .insert({
          tenant_id: data.tenant_id,
          product_id: item.product_id,
          store_id: data.store_id,
          type: 'sale',
          quantity: -(item.quantity as number),
          reference_id: sale.id,
          notes: `Sale #${sale.id}`
        })
    }
  }

  if (data.is_credit && data.customer_id) {
    const amountOwed = (data.total as number) - (data.amount_paid as number)
    if (amountOwed > 0) {
      await supabase
        .from('customer_debts')
        .insert({
          tenant_id: data.tenant_id,
          customer_id: data.customer_id,
          sale_id: sale.id,
          amount_owed: amountOwed,
          amount_paid: 0,
          status: 'open',
          due_date: data.debt_due_date
        })
    }
  }

  if (data.payment_method?.toString().startsWith('momo_')) {
    const provider = (data.payment_method as string).replace('momo_', '')
    await supabase
      .from('momo_transactions')
      .insert({
        tenant_id: data.tenant_id,
        sale_id: sale.id,
        provider,
        phone_number: data.payment_phone || '',
        amount: data.amount_paid,
        reference: data.payment_reference,
        status: 'pending'
      })
  }

  await supabase
    .from('sale_payments')
    .insert({
      sale_id: sale.id,
      method: data.payment_method,
      amount: data.amount_paid,
      reference: data.payment_reference,
      phone_number: data.payment_phone,
      status: data.is_credit ? 'pending' : 'confirmed',
      confirmed_at: data.is_credit ? null : new Date().toISOString()
    })

  return NextResponse.json({ id: sale.id, message: 'Sale synced successfully' })
}

async function syncProduct(action: string, data: Record<string, unknown>) {
  if (action === 'update') {
    const { error } = await supabase
      .from('products')
      .update({
        name: data.name,
        price: data.price,
        cost: data.cost,
        stock: data.stock,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`)
    }
  }

  return NextResponse.json({ success: true })
}

async function syncCustomer(action: string, data: Record<string, unknown>) {
  if (action === 'create') {
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: data.tenant_id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`)
    }

    return NextResponse.json({ id: customer.id })
  }

  return NextResponse.json({ success: true })
}

async function syncDebtPayment(data: Record<string, unknown>) {
  const { error: paymentError } = await supabase
    .from('customer_payments')
    .insert({
      tenant_id: data.tenant_id,
      customer_id: data.customer_id,
      amount: data.amount,
      payment_method: data.payment_method,
      reference: data.reference,
      notes: data.notes
    })

  if (paymentError) {
    throw new Error(`Failed to record payment: ${paymentError.message}`)
  }

  const { data: debt, error: debtError } = await supabase
    .from('customer_debts')
    .select('*')
    .eq('id', data.debt_id)
    .single()

  if (!debtError && debt) {
    const newAmountPaid = (debt.amount_paid || 0) + (data.amount as number)
    const newStatus = newAmountPaid >= debt.amount_owed ? 'settled' : 'partial'

    await supabase
      .from('customer_debts')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.debt_id)
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const since = searchParams.get('since')

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  }

  try {
    let productsQuery = supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)

    let customersQuery = supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)

    if (since) {
      productsQuery = productsQuery.gte('updated_at', since)
      customersQuery = customersQuery.gte('updated_at', since)
    }

    const [productsRes, customersRes] = await Promise.all([
      productsQuery,
      customersQuery
    ])

    return NextResponse.json({
      products: productsRes.data || [],
      customers: customersRes.data || [],
      synced_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Fetch sync data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync data' },
      { status: 500 }
    )
  }
}

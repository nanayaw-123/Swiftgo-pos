import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    // 1. Get total sales for the date
    const { data: sales, error: sError } = await supabase
      .from('sales')
      .select('id, total_amount')
      .eq('business_id', businessId)
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)

    if (sError) throw sError

    const totalRevenue = sales.reduce((acc:any, sale:any) => acc + Number(sale.total_amount), 0)

    // 2. Get total cost of goods sold (COGS)
    const saleIds = sales.map((s: any) => s.id)
    let totalCogs = 0

    if (saleIds.length > 0) {
      const { data: saleItems, error: siError } = await supabase
        .from('sale_items')
        .select('quantity, products(cost_price)')
        .in('sale_id', saleIds)

      if (siError) throw siError

      totalCogs = saleItems.reduce((acc:any, item: any) => {
        const cost = item.products?.cost_price || 0
        return acc + (item.quantity * cost)
      }, 0)
    }

    // 3. Get expenses (assuming an expenses table exists or using a default for now)
    // For this implementation, we'll check billing_events as an expense
    const { data: expenses, error: eError } = await supabase
      .from('billing_events')
      .select('amount')
      .eq('business_id', businessId)
      .eq('date', date)

    if (eError) throw eError

    const totalExpenses = expenses.reduce((acc:any, exp: any) => acc + Number(exp.amount), 0)

    const netProfit = totalRevenue - totalCogs - totalExpenses

    return NextResponse.json({
      date,
      revenue: totalRevenue,
      cogs: totalCogs,
      expenses: totalExpenses,
      profit: netProfit,
      margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    })

  } catch (error: any) {
    console.error('Profit Calculation Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

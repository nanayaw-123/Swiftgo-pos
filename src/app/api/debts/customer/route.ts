import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')

  let query = supabase.from('debts').select(`
    *,
    customers (name, phone),
    sales (total_amount, created_at)
  `)

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { customer_id, sale_id, amount_owed } = await req.json()

  const { data, error } = await supabase
    .from('debts')
    .insert({
      customer_id,
      sale_id,
      amount_owed,
      amount_paid: 0,
      status: 'open'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { id, amount_paid } = await req.json()

  // Get current debt
  const { data: debt } = await supabase.from('debts').select('*').eq('id', id).single()
  if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 })

  const newAmountPaid = Number(debt.amount_paid) + Number(amount_paid)
  const status = newAmountPaid >= Number(debt.amount_owed) ? 'settled' : 'open'

  const { data, error } = await supabase
    .from('debts')
    .update({ 
      amount_paid: newAmountPaid,
      status 
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

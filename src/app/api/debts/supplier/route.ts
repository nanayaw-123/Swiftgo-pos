import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const supplierId = searchParams.get('supplierId')

  let query = supabase.from('supplier_debts').select(`
    *,
    suppliers (name, phone)
  `)

  if (supplierId) {
    query = query.eq('supplier_id', supplierId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { supplier_id, amount, status } = await req.json()

  const { data, error } = await supabase
    .from('supplier_debts')
    .insert({
      supplier_id,
      amount,
      status: status || 'open'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { id, status } = await req.json()

  const { data, error } = await supabase
    .from('supplier_debts')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

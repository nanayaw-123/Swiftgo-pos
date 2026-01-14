import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // 1. Get all businesses on the Pay-As-You-Sell (payg) plan
    const { data: businesses, error: bError } = await supabase
      .from('businesses')
      .select('id, plan_id')
      .eq('plan_id', 'payg')

    if (bError) throw bError

    const charges = []

    for (const biz of businesses) {
      // 2. Check if they had at least one sale today
      const { count, error: sError } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', biz.id)
        .gte('created_at', today)

      if (sError) continue

      if (count && count > 0) {
        // 3. Check if they were already charged for today
        const { data: existingCharge } = await supabase
          .from('billing_events')
          .select('id')
          .eq('business_id', biz.id)
          .eq('date', today)
          .eq('type', 'daily_charge')
          .maybeSingle()

        if (!existingCharge) {
          // 4. Create the charge
          const { data: charge, error: cError } = await supabase
            .from('billing_events')
            .insert({
              business_id: biz.id,
              date: today,
              amount: 5,
              type: 'daily_charge',
              payment_status: 'pending'
            })
            .select()
            .single()

          if (!cError) charges.push(charge)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: businesses.length, 
      chargesCreated: charges.length 
    })

  } catch (error: any) {
    console.error('Billing Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

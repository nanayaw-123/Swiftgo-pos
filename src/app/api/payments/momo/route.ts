import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { 
      amount, 
      phoneNumber, 
      provider, 
      saleId,
      businessId,
      branchId 
    } = await req.json()

    // 1. Validate Ghana phone number formats
    const phoneRegex = /^(0|233)(24|54|55|59|20|50|26|57|27)[0-9]{7}$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ error: 'Invalid Ghana MoMo number' }, { status: 400 })
    }

    // 2. Log the payment attempt (Pending)
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .insert({
        sale_id: saleId,
        method: 'momo',
        amount,
        reference: `MOMO-${Date.now()}`,
        status: 'pending',
        metadata: { phoneNumber, provider }
      })
      .select()
      .single()

    if (pError) throw pError

    // 3. Simulate MoMo Provider Interaction
    // In production, this would call Hubtel, Paystack, or Flutterwave
    console.log(`Initiating ${provider} MoMo prompt for ${phoneNumber} - Amount: GHS ${amount}`)

    // We simulate a successful prompt initiation
    // The user would then get a USSD prompt on their phone
    
    return NextResponse.json({ 
      success: true, 
      message: 'MoMo prompt sent. Please confirm on your phone.',
      paymentId: payment.id,
      reference: payment.reference
    })

  } catch (error: any) {
    console.error('MoMo Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json({ error: 'Reference required' }, { status: 400 })
  }

  const supabase = await createClient()
  
  // Simulate checking payment status
  // In reality, this would be a webhook or a polling check to the provider
  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('reference', reference)
    .single()

  if (error || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  return NextResponse.json({ 
    status: payment.status,
    amount: payment.amount,
    confirmedAt: payment.created_at
  })
}

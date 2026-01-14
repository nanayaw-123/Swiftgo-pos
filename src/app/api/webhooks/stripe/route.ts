import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic rendering - prevent build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Lazy import to prevent build-time initialization
    const { stripe } = await import('@/lib/payment/stripe-client');
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // Get Stripe client at runtime
      const stripeClient = stripe();
      event = stripeClient.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status via API
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-transactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
            body: JSON.stringify({
              gateway_transaction_id: paymentIntent.id,
              status: 'completed',
              metadata: {
                stripeChargeId: (paymentIntent as any).latest_charge,
              },
            })
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-transactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gateway_transaction_id: paymentIntent.id,
            status: 'failed',
            metadata: {
              failureReason: paymentIntent.last_payment_error?.message,
            },
          })
        });
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-transactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gateway_transaction_id: session.id,
            status: 'completed',
            metadata: {
              paymentIntentId: session.payment_intent,
            },
          })
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
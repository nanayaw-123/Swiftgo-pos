import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || '';

function verifyPaystackSignature(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha512', webhookSecret)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!verifyPaystackSignature(body, signature)) {
      console.error('Paystack signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const data = event.data;

    switch (eventType) {
      case 'charge.success': {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-transactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gateway_transaction_id: data.reference,
            status: 'completed',
            metadata: {
              paystackTransactionId: data.id,
              paystackAuthorizationCode: data.authorization?.authorization_code,
            },
          })
        });
        break;
      }

      case 'charge.failed': {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-transactions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gateway_transaction_id: data.reference,
            status: 'failed',
            metadata: {
              failureReason: data.gateway_response,
            },
          })
        });
        break;
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

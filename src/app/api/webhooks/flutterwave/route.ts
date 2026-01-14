import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const flutterwaveSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';

function verifyFlutterwaveSignature(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha256', flutterwaveSecret)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('verif-hash');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!verifyFlutterwaveSignature(payload, signature)) {
      console.error('Flutterwave signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const body = JSON.parse(payload);
    const event = body.event;
    const data = body.data;

    switch (event) {
      case 'charge.completed': {
        if (data.status === 'successful') {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-transactions`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gateway_transaction_id: data.flw_ref,
              status: 'completed',
              metadata: {
                flutterwaveTransactionId: data.id,
                flutterwaveReference: data.flw_ref,
              },
            })
          });
        } else if (data.status === 'failed') {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-transactions`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gateway_transaction_id: data.flw_ref,
              status: 'failed',
              metadata: {
                failureReason: data.processor_response,
              },
            })
          });
        }
        break;
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

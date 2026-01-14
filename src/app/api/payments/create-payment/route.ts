import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Ensure this route is dynamic to prevent build-time errors
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Explicitly use Node.js runtime

const PaymentRequestSchema = z.object({
  provider: z.enum(['stripe', 'paystack', 'flutterwave']),
  amount: z.number().int().positive(),
  currency: z.enum(['USD', 'GHS', 'NGN', 'KES']),
  customerId: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  description: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  network: z.enum(['MTN', 'Vodafone', 'AirtelTigo', 'Mpesa']).optional(),
  country: z.string().length(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Lazy-load payment service to avoid build-time initialization
    const { paymentService } = await import('@/lib/payment/payment-service');
    
    const body = await request.json();
    const validatedData = PaymentRequestSchema.parse(body);

    let payment;

    switch (validatedData.provider) {
      case 'stripe':
        if (!validatedData.successUrl || !validatedData.cancelUrl) {
          return NextResponse.json(
            { error: 'successUrl and cancelUrl required for Stripe' },
            { status: 400 }
          );
        }
          payment = await paymentService.createStripePayment({
            ...validatedData,
            metadata: validatedData.metadata as Record<string, string> | undefined,
            customerPhone: validatedData.customerPhone || '',
            successUrl: validatedData.successUrl,
            cancelUrl: validatedData.cancelUrl,
          });
        break;

      case 'paystack':
        payment = await paymentService.createPaystackPayment({
          ...validatedData,
          metadata: validatedData.metadata as Record<string, string> | undefined,
          customerPhone: validatedData.customerPhone || '',
        });
        break;

      case 'flutterwave':
        if (!validatedData.network || !validatedData.country) {
          return NextResponse.json(
            { error: 'network and country required for Flutterwave' },
            { status: 400 }
          );
        }
        payment = await paymentService.createFlutterwavePayment({
          ...validatedData,
          metadata: validatedData.metadata as Record<string, string> | undefined,
          customerPhone: validatedData.customerPhone || '',
          network: validatedData.network,
          country: validatedData.country,
        });
        break;


      default:
        return NextResponse.json(
          { error: 'Invalid payment provider' },
          { status: 400 }
        );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
import Stripe from 'stripe';

// Lazy initialization to prevent build-time errors
let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
      stripeInstance = new Stripe(apiKey, {
        apiVersion: '2025-10-29.clover',
        typescript: true,
      });
  }
  return stripeInstance;
}

export async function createStripeCheckoutSession(params: {
  amount: number;
  currency: string;
  customerId: string;
  customerEmail: string;
  description: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: params.customerEmail,
    client_reference_id: params.customerId,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amount,
          product_data: {
            name: params.description,
            metadata: params.metadata,
          },
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });

  return session;
}

export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  customerId: string;
  metadata: Record<string, string>;
  description: string;
}) {
  const stripe = getStripeClient();
  const intent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    description: params.description,
    metadata: params.metadata,
    automatic_payment_methods: { enabled: true },
  });

  return intent;
}

export async function verifyStripePayment(paymentIntentId: string) {
  const stripe = getStripeClient();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
  };
}

// Export getter instead of instance
export { getStripeClient as stripe };
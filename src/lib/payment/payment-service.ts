import { v4 as uuidv4 } from 'uuid';
import { PaymentRequest, PaymentResponse, PaymentStatus } from '../types/payments';
import {
  createStripeCheckoutSession,
  verifyStripePayment,
} from './stripe-client';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from './paystack-client';
import {
  chargeMobileMoneyFlutterwave,
  verifyFlutterwaveTransaction,
} from './flutterwave-client';

export class PaymentService {
  async createStripePayment(
    payment: PaymentRequest & { successUrl: string; cancelUrl: string }
  ): Promise<PaymentResponse> {
    const transactionRef = payment.reference || `stripe_${uuidv4()}`;

    // Create checkout session
    const session = await createStripeCheckoutSession({
      amount: payment.amount,
      currency: payment.currency,
      customerId: payment.customerId,
      customerEmail: payment.customerEmail,
      description: payment.description,
      metadata: payment.metadata || {},
      successUrl: payment.successUrl,
      cancelUrl: payment.cancelUrl,
    });

    // Store in database via API
    await fetch('/api/payment-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : ''}`
      },
      body: JSON.stringify({
        sale_id: payment.customerId,
        payment_gateway: 'stripe',
        gateway_transaction_id: session.id,
        payment_method: 'card',
        amount: (payment.amount / 100).toFixed(2),
        currency: payment.currency,
        status: 'pending',
        customer_email: payment.customerEmail,
        metadata: payment.metadata,
      })
    });

    return {
      transactionId: session.id,
      reference: transactionRef,
      status: 'pending',
      amount: payment.amount,
      currency: payment.currency,
      provider: 'stripe',
      authorizationUrl: session.url || undefined,
      createdAt: new Date(),
    };
  }

  async createPaystackPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    const transactionRef = payment.reference || `paystack_${uuidv4()}`;
    const amountInKobo = payment.amount;

    const response = await initializePaystackTransaction({
      email: payment.customerEmail,
      amount: amountInKobo,
      reference: transactionRef,
      metadata: {
        customerId: payment.customerId,
        ...payment.metadata,
      },
    });

    // Store in database via API
    await fetch('/api/payment-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : ''}`
      },
      body: JSON.stringify({
        sale_id: payment.customerId,
        payment_gateway: 'paystack',
        gateway_transaction_id: response.data.reference,
        payment_method: 'mobile_money',
        amount: (payment.amount / 100).toFixed(2),
        currency: payment.currency,
        status: 'pending',
        customer_email: payment.customerEmail,
        customer_phone: payment.customerPhone,
        metadata: payment.metadata,
      })
    });

    return {
      transactionId: response.data.reference,
      reference: transactionRef,
      status: 'pending',
      amount: payment.amount,
      currency: payment.currency,
      provider: 'paystack',
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
      createdAt: new Date(),
    };
  }

  async createFlutterwavePayment(
    payment: PaymentRequest & { network: string; country: string }
  ): Promise<PaymentResponse> {
    const transactionRef = payment.reference || `flutterwave_${uuidv4()}`;

    const response = await chargeMobileMoneyFlutterwave({
      phone_number: payment.customerPhone,
      email: payment.customerEmail,
      amount: payment.amount / 100,
      currency: payment.currency,
      tx_ref: transactionRef,
      network: payment.network as any,
      fullname: payment.metadata?.fullname || 'Customer',
      country: payment.country,
    });

    // Store in database via API
    await fetch('/api/payment-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : ''}`
      },
      body: JSON.stringify({
        sale_id: payment.customerId,
        payment_gateway: 'flutterwave',
        gateway_transaction_id: response.data.flw_ref,
        payment_method: 'mobile_money',
        mobile_money_provider: payment.network,
        amount: (payment.amount / 100).toFixed(2),
        currency: payment.currency,
        status: 'processing',
        customer_email: payment.customerEmail,
        customer_phone: payment.customerPhone,
        metadata: payment.metadata,
      })
    });

    return {
      transactionId: response.data.flw_ref,
      reference: transactionRef,
      status: 'processing',
      amount: payment.amount,
      currency: payment.currency,
      provider: 'flutterwave',
      flwRef: response.data.flw_ref,
      createdAt: new Date(),
    };
  }

  async verifyPayment(provider: string, externalId: string) {
    try {
      let verificationResult;

      if (provider === 'stripe') {
        verificationResult = await verifyStripePayment(externalId);
      } else if (provider === 'paystack') {
        verificationResult = await verifyPaystackTransaction(externalId);
      } else if (provider === 'flutterwave') {
        verificationResult = await verifyFlutterwaveTransaction(externalId);
      }

      return verificationResult;
    } catch (error) {
      console.error(`Verification failed for ${provider}:`, error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();

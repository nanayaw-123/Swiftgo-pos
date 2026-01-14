const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export interface InitializeTransactionParams {
  email: string;
  amount: number; // in kobo (amount * 100)
  reference?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface MobileMoneyChargeParams {
  email: string;
  amount: number; // in kobo
  phone: string;
  network: 'MTN' | 'Vodafone' | 'AirtelTigo';
  reference?: string;
}

export async function initializePaystackTransaction(
  params: InitializeTransactionParams
) {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference || `ref_${Date.now()}`,
      currency: params.currency || 'GHS',
      metadata: params.metadata,
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }

  return {
    status: data.status,
    message: data.message,
    data: {
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    },
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'Failed to verify Paystack transaction');
  }

  return {
    status: data.data.status,
    amount: data.data.amount / 100,
    currency: data.data.currency,
    customer: data.data.customer,
    authorization: data.data.authorization,
  };
}

export async function chargeMobileMoneyPaystack(
  params: MobileMoneyChargeParams
) {
  const response = await fetch('https://api.paystack.co/charge', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference || `mm_${Date.now()}`,
      mobile_money: {
        phone: params.phone,
        provider: params.network.toLowerCase(),
      },
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'Failed to charge mobile money');
  }

  return data;
}

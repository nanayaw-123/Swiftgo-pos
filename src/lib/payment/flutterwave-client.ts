// Flutterwave client - optional integration
// Note: Install flutterwave-node-v3 if you want to use Flutterwave
// npm install flutterwave-node-v3

export interface FlutterChargeMobileMoneyParams {
  phone_number: string;
  email: string;
  amount: number;
  currency: string;
  tx_ref: string;
  network: 'MTN' | 'Vodafone' | 'Airtel';
  fullname: string;
  country: string;
}

// Lazy-load Flutterwave client to avoid build-time errors
function getFlutterwaveClient() {
  if (!process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || !process.env.FLUTTERWAVE_SECRET_KEY) {
    throw new Error('Flutterwave is not configured. Please add FLUTTERWAVE_PUBLIC_KEY and FLUTTERWAVE_SECRET_KEY to your environment variables.');
  }

  try {
    const Flutterwave = require('flutterwave-node-v3');
    return new Flutterwave(
      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      process.env.FLUTTERWAVE_SECRET_KEY
    );
  } catch (error: any) {
    if (error?.code === 'MODULE_NOT_FOUND') {
      throw new Error('Flutterwave package not installed. Run: npm install flutterwave-node-v3');
    }
    throw error;
  }
}

export async function chargeMobileMoneyFlutterwave(
  params: FlutterChargeMobileMoneyParams
) {
  const flutterwave = getFlutterwaveClient();

  const payload = {
    phone_number: params.phone_number,
    email: params.email,
    amount: params.amount,
    currency: params.currency,
    tx_ref: params.tx_ref,
    network: params.network,
    fullname: params.fullname,
    country: params.country,
  };

  try {
    const response = await flutterwave.MobileMoney.ghana(payload);
    return response;
  } catch (error: any) {
    throw new Error(`Flutterwave mobile money charge failed: ${error?.message || error}`);
  }
}

export async function verifyFlutterwaveTransaction(transactionId: string) {
  const flutterwave = getFlutterwaveClient();

  try {
    const response = await flutterwave.Transaction.verify({
      id: transactionId,
    });
    return response;
  } catch (error: any) {
    throw new Error(`Flutterwave verification failed: ${error?.message || error}`);
  }
}
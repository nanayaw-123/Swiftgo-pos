'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CreditCard, Smartphone, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MobileMoneyNetwork, Currency } from '@/lib/types/payments';

type Provider = 'stripe' | 'paystack' | 'flutterwave';

interface PaymentCheckoutProps {
  amount: number; // in cents/subunits
  currency: Currency;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentCheckout({
  amount,
  currency,
  customerId,
  customerEmail,
  customerPhone = '',
  description,
  onSuccess,
  onCancel,
}: PaymentCheckoutProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>('stripe');
  const [network, setNetwork] = useState<MobileMoneyNetwork>('MTN');
  const [phone, setPhone] = useState(customerPhone);
  const [loading, setLoading] = useState(false);

  const formatAmount = () => {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  };

  const handlePayment = async () => {
    if ((provider === 'paystack' || provider === 'flutterwave') && !phone) {
      toast.error('Phone number is required for mobile money payments');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const payload: any = {
        provider,
        amount,
        currency,
        customerId,
        customerEmail,
        description,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      };

      if (provider === 'paystack' || provider === 'flutterwave') {
        payload.customerPhone = phone;
        payload.network = network;
        payload.country = getCurrencyCountry(currency);
      }

      const response = await fetch('/api/payments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      if (data.authorizationUrl) {
        // Redirect to payment page
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
          window.parent.postMessage(
            { type: 'OPEN_EXTERNAL_URL', data: { url: data.authorizationUrl } },
            '*'
          );
        } else {
          window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
        }
        
        toast.success('Payment initiated. Complete payment in the new window.');
        onSuccess?.();
      } else if (provider === 'flutterwave') {
        toast.success('Mobile money payment initiated. Check your phone.');
        router.push(`/payment/processing?ref=${data.reference}&provider=flutterwave`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  function getCurrencyCountry(curr: Currency): string {
    const map: Record<Currency, string> = {
      USD: 'US',
      GHS: 'GH',
      NGN: 'NG',
      KES: 'KE',
    };
    return map[curr];
  }

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Payment Checkout</h2>

      <div className="mb-6 p-4 bg-primary/10 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary">{formatAmount()}</p>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">Select Payment Method</Label>
          <RadioGroup value={provider} onValueChange={(value) => setProvider(value as Provider)}>
            <Card className={`p-4 cursor-pointer transition-all ${provider === 'stripe' ? 'border-primary border-2' : ''}`}>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-3 cursor-pointer flex-1">
                  <CreditCard className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Credit/Debit Card</p>
                    <p className="text-xs text-muted-foreground">International payments via Stripe</p>
                  </div>
                </Label>
              </div>
            </Card>

            <Card className={`p-4 cursor-pointer transition-all ${provider === 'paystack' ? 'border-primary border-2' : ''}`}>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="paystack" id="paystack" />
                <Label htmlFor="paystack" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Smartphone className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Mobile Money (Paystack)</p>
                    <p className="text-xs text-muted-foreground">MTN, Vodafone, AirtelTigo</p>
                  </div>
                </Label>
              </div>
            </Card>

            <Card className={`p-4 cursor-pointer transition-all ${provider === 'flutterwave' ? 'border-primary border-2' : ''}`}>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="flutterwave" id="flutterwave" />
                <Label htmlFor="flutterwave" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Globe className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Mobile Money (Flutterwave)</p>
                    <p className="text-xs text-muted-foreground">Pan-African mobile money</p>
                  </div>
                </Label>
              </div>
            </Card>
          </RadioGroup>
        </div>

        {(provider === 'paystack' || provider === 'flutterwave') && (
          <>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
                required
              />
            </div>

            <div>
              <Label htmlFor="network">Mobile Money Network *</Label>
              <Select value={network} onValueChange={(value) => setNetwork(value as MobileMoneyNetwork)}>
                <SelectTrigger id="network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {provider === 'paystack' && (
                    <>
                      <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                      <SelectItem value="Vodafone">Vodafone Cash</SelectItem>
                      <SelectItem value="AirtelTigo">AirtelTigo Money</SelectItem>
                    </>
                  )}
                  {provider === 'flutterwave' && (
                    <>
                      <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                      <SelectItem value="Mpesa">M-Pesa</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {formatAmount()}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>Your payment is secure and encrypted</p>
      </div>
    </Card>
  );
}

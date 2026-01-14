// Payment Gateway Types
export type PaymentProvider = 'stripe' | 'paystack' | 'flutterwave';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type Currency = 'USD' | 'GHS' | 'NGN' | 'KES';
export type MobileMoneyNetwork = 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Mpesa';

// Payment Request
export interface PaymentRequest {
  amount: number; // in cents/subunits
  currency: Currency;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  metadata?: Record<string, string>;
  reference?: string; // unique transaction ref
  idempotencyKey?: string;
}

// Mobile Money Payment
export interface MobileMoneyPayment extends PaymentRequest {
  provider: 'paystack' | 'flutterwave';
  mobileMoneyNetwork: MobileMoneyNetwork;
  customerPhone: string;
  country: 'GH' | 'NG' | 'KE'; // ISO country code
}

// Card Payment
export interface CardPayment extends PaymentRequest {
  provider: 'stripe';
  successUrl: string;
  cancelUrl: string;
}

// Payment Response
export interface PaymentResponse {
  transactionId: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  provider: PaymentProvider;
  authorizationUrl?: string; // for redirects
  paymentIntentId?: string; // Stripe
  accessCode?: string; // Paystack
  flwRef?: string; // Flutterwave
  createdAt: Date;
  expiresAt?: Date;
}

// Webhook Event
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  provider: PaymentProvider;
  timestamp: Date;
  verified: boolean;
}

// Payment Record for DB
export interface PaymentRecord {
  id: string;
  transactionRef: string;
  provider: PaymentProvider;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
  externalId?: string; // Stripe ID, Paystack ref, etc.
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
  retryCount: number;
}

// Retry Strategy
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}
